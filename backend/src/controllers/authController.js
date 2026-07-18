const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendMail } = require('../utils/mailer');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'store_rating_secret_key_123';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validations helper
const validateFields = (name, email, password, address, isNewUser = true) => {
  const errors = [];

  // Name validation: Min 20, Max 60 characters
  if (isNewUser) {
    if (!name || name.trim().length < 2 || name.trim().length > 60) {
      errors.push('Name must be between 2 and 60 characters.');
    }
  }

  // Email validation: Standard rules
  if (isNewUser && email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address.');
    }
  }

  // Password validation: 8-16 characters, 1 uppercase, 1 special character
  if (password) {
    if (password.length < 8 || password.length > 16) {
      errors.push('Password must be between 8 and 16 characters.');
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasUppercase) {
      errors.push('Password must include at least one uppercase letter.');
    }
    if (!hasSpecialChar) {
      errors.push('Password must include at least one special character.');
    }
  }

  // Address validation: Max 400 characters
  if (isNewUser && address) {
    if (address.length > 400) {
      errors.push('Address cannot exceed 400 characters.');
    }
  }

  return errors;
};

exports.register = async (req, res) => {
  const { name, email, password, address } = req.body;

  const errors = validateFields(name, email, password, address, true);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // Check if email already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await db.query(
      'INSERT INTO users (name, email, password, address, role, is_verified, verification_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, address, 'normal', 0, verificationCode]
    );

    // Send email using Nodemailer
    await sendMail(
      email,
      'Email Verification Code - StoreRating',
      `Welcome to StoreRating!\n\nYour 6-digit verification code is: ${verificationCode}\n\nPlease enter this code on the verification page to activate your account.`,
      `<div style="font-family: sans-serif; padding: 20px; color: #333;">
         <h2>Welcome to StoreRating!</h2>
         <p>Please verify your email address by entering the following 6-digit code on the verification page:</p>
         <div style="font-size: 24px; font-weight: bold; color: #6366f1; letter-spacing: 2px; padding: 10px; background: #f3f4f6; display: inline-block; border-radius: 6px; margin: 10px 0;">
           ${verificationCode}
         </div>
         <p>If you did not request this registration, please ignore this email.</p>
       </div>`
    );

    return res.status(201).json({ message: 'Registration successful!', code: verificationCode });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'An error occurred during registration.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password.' });
  }

  try {
    // Fetch user
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // For Users and Store Owners: always require a fresh email OTP verification on login
    if (user.role === 'normal' || user.role === 'owner') {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await db.query('UPDATE users SET is_verified = 0, verification_code = ? WHERE id = ?', [code, user.id]);

      // Send email using Nodemailer
      await sendMail(
        user.email,
        'Email Verification Required - StoreRating',
        `Please verify your email address to log in.\n\nYour 6-digit verification code is: ${code}`,
        `<div style="font-family: sans-serif; padding: 20px; color: #333;">
           <h2>Account Verification Required</h2>
           <p>To access your account, please verify your email address by entering the following 6-digit code on the verification page:</p>
           <div style="font-size: 24px; font-weight: bold; color: #6366f1; letter-spacing: 2px; padding: 10px; background: #f3f4f6; display: inline-block; border-radius: 6px; margin: 10px 0;">
             ${code}
           </div>
         </div>`
      );

      return res.status(400).json({
        error: 'A verification code has been sent to your email address. Please enter the OTP to log in.',
        unverified: true,
        email: user.email,
        code: code
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An error occurred during login.' });
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Please provide both old and new passwords.' });
  }

  const errors = validateFields(null, null, newPassword, null, false);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const users = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, users[0].password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Incorrect old password.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    return res.json({ message: 'Password updated successfully!' });
  } catch (err) {
    console.error('Password change error:', err);
    return res.status(500).json({ error: 'An error occurred while updating your password.' });
  }
};

// 4. Verify Email Verification Code
exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Please provide both email and verification code.' });
  }

  try {
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'User with this email does not exist.' });
    }

    const user = users[0];
    if (user.verification_code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Mark as verified
    await db.query('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?', [user.id]);

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      message: 'Email verified successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ error: 'Failed to verify email.' });
  }
};

// 5. Forgot Password (Nodemailer send temporary password)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please enter your email address.' });
  }

  try {
    const users = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'No account registered with this email address.' });
    }

    const user = users[0];
    const tempPassword = Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000) + '!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Force user to re-verify upon next login by setting is_verified = 0
    await db.query('UPDATE users SET password = ?, is_verified = 0 WHERE id = ?', [hashedPassword, user.id]);

    // Send email using Nodemailer
    await sendMail(
      email,
      'Password Reset Request - StoreRating',
      `Hello ${user.name},\n\nWe received a request to reset your password.\nYour new temporary password is: ${tempPassword}\n\nPlease log in using this password. You will be prompted to verify your email, after which you can update your password from your profile settings.`,
      `<div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
         <h2 style="color: #6366f1;">Password Reset Request</h2>
         <p>Hello <strong>${user.name}</strong>,</p>
         <p>We received a request to reset your password. A new temporary password has been generated for your account:</p>
         <div style="padding: 15px; background: #f3f4f6; border-radius: 8px; margin: 15px 0; font-size: 18px; font-weight: bold; letter-spacing: 1px; color: #6366f1; display: inline-block;">
           ${tempPassword}
         </div>
         <p>Please log in using this temporary password. You will be prompted to verify your email, after which you should change your password from your profile settings immediately.</p>
       </div>`
    );

    return res.json({ message: 'Temporary password sent to email successfully!', code: tempPassword });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'An error occurred during password reset.' });
  }
};

// 6. Resend OTP Verification Code
exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Please provide your email address.' });
  }

  try {
    const users = await db.query('SELECT id, name, role FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const user = users[0];
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    await db.query('UPDATE users SET verification_code = ?, is_verified = 0 WHERE id = ?', [newCode, user.id]);

    // Send OTP email
    const emailResult = await sendMail(
      email,
      'New Verification Code - StoreRating',
      `Hello ${user.name},\n\nYour new 6-digit verification code is: ${newCode}\n\nPlease enter this code on the verification page to access your account.`,
      `<div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
         <h2 style="color: #6366f1;">New Verification Code</h2>
         <p>Hello <strong>${user.name}</strong>,</p>
         <p>You requested a new verification code. Please use the following 6-digit code to verify your email:</p>
         <div style="font-size: 28px; font-weight: bold; color: #6366f1; letter-spacing: 4px; padding: 12px 20px; background: #f3f4f6; display: inline-block; border-radius: 8px; margin: 12px 0;">
           ${newCode}
         </div>
         <p style="color: #666; font-size: 0.9rem;">If you did not request this, please ignore this email.</p>
       </div>`
    );

    console.log(`[Resend OTP] Email: ${email}, Code: ${newCode}, Result:`, emailResult);

    if (emailResult && emailResult.error) {
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    return res.json({ message: 'A new verification code has been sent to your email!' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ error: 'Failed to resend verification code.' });
  }
};

