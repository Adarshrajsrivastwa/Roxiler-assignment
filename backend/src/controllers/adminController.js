const bcrypt = require('bcryptjs');
const db = require('../db');
const { sendMail } = require('../utils/mailer');

// Validations helper
const validateFields = (name, email, password, address, role) => {
  const errors = [];

  // Name validation: Min 2, Max 60 characters
  if (!name || name.trim().length < 2 || name.trim().length > 60) {
    errors.push('Name must be between 2 and 60 characters.');
  }

  // Email validation: Standard rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please enter a valid email address.');
  }

  // Password validation: 8-16 characters, 1 uppercase, 1 special character
  if (!password || password.length < 8 || password.length > 16) {
    errors.push('Password must be between 8 and 16 characters.');
  } else {
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
  if (!address || address.length > 400) {
    errors.push('Address is required and cannot exceed 400 characters.');
  }

  // Role validation
  if (!role || !['admin', 'normal', 'owner'].includes(role)) {
    errors.push('Invalid user role specified.');
  }

  return errors;
};

// 1. Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    const storesCount = await db.query('SELECT COUNT(*) as count FROM stores');
    const ratingsCount = await db.query('SELECT COUNT(*) as count FROM ratings');

    return res.json({
      totalUsers: usersCount[0].count,
      totalStores: storesCount[0].count,
      totalRatings: ratingsCount[0].count
    });
  } catch (err) {
    console.error('Stats fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
};

// 2. Add User (Admin can add Admin, Normal User, and Store Owner)
exports.addUser = async (req, res) => {
  const { name, email, password, address, role } = req.body;

  const errors = validateFields(name, email, password, address, role);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const existingUser = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isOwnerOrUser = role === 'owner' || role === 'normal';
    const verificationCode = isOwnerOrUser ? Math.floor(100000 + Math.random() * 900000).toString() : null;
    const isVerified = isOwnerOrUser ? 0 : 1;

    await db.query(
      'INSERT INTO users (name, email, password, address, role, is_verified, verification_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, address, role, isVerified, verificationCode]
    );

    // Send email using Nodemailer
    const roleLabel = role === 'owner' ? 'Store Owner' : role === 'admin' ? 'System Administrator' : 'User';
    let messageText = `Hello ${name},\n\nAn administrator has created your account on StoreRating.\n\nHere are your account credentials:\nEmail: ${email}\nPassword: ${password}\nRole: ${roleLabel}\nAddress: ${address}`;
    let messageHtml = `<div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
         <h2 style="color: #6366f1;">Welcome to StoreRating!</h2>
         <p>Hello <strong>${name}</strong>,</p>
         <p>An administrator has created an account for you on our platform. Here are your account credentials and details:</p>
         <div style="padding: 15px; background: #f3f4f6; border-radius: 8px; margin: 15px 0;">
           <strong>Login Email:</strong> ${email}<br/>
           <strong>Temporary Password:</strong> ${password}<br/>
           <strong>Account Role:</strong> ${roleLabel}<br/>
           <strong>Address Location:</strong> ${address}
         </div>
    `;

    if (isOwnerOrUser) {
      messageText += `\n\nTo activate your account and log in, please verify your email.\nYour 6-digit verification code is: ${verificationCode}`;
      messageHtml += `
         <p>To activate your account and log in, please enter the following 6-digit verification code on the verification page:</p>
         <div style="font-size: 24px; font-weight: bold; color: #6366f1; letter-spacing: 2px; padding: 10px; background: #e0e7ff; display: inline-block; border-radius: 6px; margin: 10px 0;">
           ${verificationCode}
         </div>
      `;
    } else {
      messageText += `\n\nYour account is active. You can log in directly at http://localhost:5173/login`;
      messageHtml += `
         <p style="color: #10b981; font-weight: bold;">Your account is fully activated. You can log in directly using the credentials above.</p>
      `;
    }
    messageHtml += `</div>`;

    await sendMail(email, 'Welcome to StoreRating - Account Created', messageText, messageHtml);

    return res.status(201).json({ message: 'User added successfully!', code: verificationCode });
  } catch (err) {
    console.error('Add user error:', err);
    return res.status(500).json({ error: 'Failed to add new user.' });
  }
};

// 3. Add Store
exports.addStore = async (req, res) => {
  const { name, address, ownerId } = req.body;
  const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const errors = [];
  if (!name || name.trim().length < 2 || name.trim().length > 60) {
    errors.push('Store Name must be between 2 and 60 characters.');
  }
  if (!ownerId) {
    errors.push('Store Owner selection is required.');
  }
  if (!address || address.length > 400) {
    errors.push('Address is required and cannot exceed 400 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // Retrieve owner's email to assign as the store email
    const owners = await db.query('SELECT email, name FROM users WHERE id = ?', [ownerId]);
    if (owners.length === 0) {
      return res.status(400).json({ error: 'Selected Store Owner does not exist.' });
    }
    const email = owners[0].email;
    const ownerName = owners[0].name;

    // Check if store owner already has an assigned store
    const existingStoreByOwner = await db.query('SELECT id FROM stores WHERE owner_id = ?', [ownerId]);
    if (existingStoreByOwner.length > 0) {
      return res.status(400).json({ error: 'This Store Owner is already assigned to a store.' });
    }

    const existingStoreByEmail = await db.query('SELECT id FROM stores WHERE email = ?', [email]);
    if (existingStoreByEmail.length > 0) {
      return res.status(400).json({ error: 'A store with this owner\'s email is already registered.' });
    }

    // Insert store
    await db.query(
      'INSERT INTO stores (name, email, address, logo_url, owner_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, address, logoUrl, parseInt(ownerId)]
    );

    console.log(`[Store Assigned] Owner: ${ownerName} (${email}) is assigned to store: ${name}`);

    // Send email using Nodemailer
    const ownersData = await db.query('SELECT name, email, is_verified, verification_code FROM users WHERE id = ?', [ownerId]);
    if (ownersData.length > 0) {
      const owner = ownersData[0];
      let messageText = `Hello ${owner.name},\n\nYou have been assigned as the owner of the store outlet: ${name}.\nStore Name: ${name}\nLocation: ${address}\nOwner Name: ${owner.name}\nOwner Email: ${owner.email}`;
      let messageHtml = `<div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
         <h2 style="color: #6366f1;">Store Assigned Successfully</h2>
         <p>Hello <strong>${owner.name}</strong>,</p>
         <p>You have been assigned as the owner of the following store outlet:</p>
         <div style="padding: 15px; background: #f3f4f6; border-radius: 8px; margin: 15px 0;">
           <strong>Store Name:</strong> ${name}<br/>
           <strong>Store Address:</strong> ${address}<br/>
           <strong>Owner Name:</strong> ${owner.name}<br/>
           <strong>Owner Email / Store Email:</strong> ${owner.email}
         </div>
      `;
      messageHtml += `</div>`;
      await sendMail(owner.email, `Store Assigned: ${name} - StoreRating`, messageText, messageHtml);
    }

    return res.status(201).json({ message: 'Store added successfully!' });
  } catch (err) {
    console.error('Add store error:', err);
    return res.status(500).json({ error: 'Failed to add new store.' });
  }
};

// 4. View list of Stores with sorting and search filters
exports.getStores = async (req, res) => {
  // Sort field, sort order, search query
  const { search = '', sortBy = 'name', sortOrder = 'ASC' } = req.query;

  // Validate sorting fields to prevent SQL injection
  const allowedSortFields = ['name', 'email', 'address', 'rating'];
  const cleanSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
  const cleanSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  try {
    let sql = `
      SELECT 
        s.id, s.name, s.email, s.address, s.logo_url, s.owner_id,
        COALESCE(AVG(r.rating), 0) as rating,
        COUNT(r.id) as ratingCount
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
    `;

    const params = [];

    // Filter by name, email, address
    if (search.trim()) {
      sql += ` WHERE s.name LIKE ? OR s.email LIKE ? OR s.address LIKE ?`;
      const likeParam = `%${search}%`;
      params.push(likeParam, likeParam, likeParam);
    }

    sql += ` GROUP BY s.id`;

    // Handle sorting by computed field 'rating' vs base table fields
    if (cleanSortBy === 'rating') {
      sql += ` ORDER BY rating ${cleanSortOrder}`;
    } else {
      sql += ` ORDER BY s.${cleanSortBy} ${cleanSortOrder}`;
    }

    const stores = await db.query(sql, params);
    return res.json(stores);
  } catch (err) {
    console.error('Get stores error:', err);
    return res.status(500).json({ error: 'Failed to retrieve stores list.' });
  }
};

// 5. View list of users (normal and admin) with sorting, filtering
exports.getUsers = async (req, res) => {
  const { search = '', role = '', sortBy = 'name', sortOrder = 'ASC' } = req.query;

  const allowedSortFields = ['name', 'email', 'address', 'role'];
  const cleanSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
  const cleanSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  try {
    let sql = `SELECT id, name, email, address, role, created_at FROM users`;
    const params = [];
    const conditions = [];

    // Filter by Name, Email, Address
    if (search.trim()) {
      conditions.push(`(name LIKE ? OR email LIKE ? OR address LIKE ?)`);
      const likeParam = `%${search}%`;
      params.push(likeParam, likeParam, likeParam);
    }

    // Filter by Role (admin, normal, owner)
    if (role.trim()) {
      conditions.push(`role = ?`);
      params.push(role);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    sql += ` ORDER BY ${cleanSortBy} ${cleanSortOrder}`;

    const users = await db.query(sql, params);
    return res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ error: 'Failed to retrieve users list.' });
  }
};

// 6. View User Details (If owner, show average store rating too)
exports.getUserDetails = async (req, res) => {
  const userId = req.params.id;

  try {
    const users = await db.query('SELECT id, name, email, address, role, created_at FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[0];

    // If Store Owner, fetch their store rating details
    if (user.role === 'owner') {
      const stores = await db.query(`
        SELECT 
          s.id as store_id, s.name as store_name, s.address as store_address,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(r.id) as total_ratings
        FROM stores s
        LEFT JOIN ratings r ON s.id = r.store_id
        WHERE s.owner_id = ?
        GROUP BY s.id
      `, [user.id]);

      user.store = stores.length > 0 ? stores[0] : null;
    }

    return res.json(user);
  } catch (err) {
    console.error('Get user details error:', err);
    return res.status(500).json({ error: 'Failed to retrieve user details.' });
  }
};

// 7. Get owners who don't have a store yet (to assign new store owners)
exports.getUnassignedOwners = async (req, res) => {
  try {
    const owners = await db.query(`
      SELECT u.id, u.name, u.email 
      FROM users u
      LEFT JOIN stores s ON u.id = s.owner_id
      WHERE u.role = 'owner' AND s.id IS NULL
    `);
    return res.json(owners);
  } catch (err) {
    console.error('Unassigned owners fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve unassigned store owners.' });
  }
};

// 8. Update User Details
exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const { name, email, password, address, role } = req.body;

  const errors = [];

  // Name validation
  if (!name || name.trim().length < 2 || name.trim().length > 60) {
    errors.push('Name must be between 2 and 60 characters.');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please enter a valid email address.');
  }

  // Password validation (Optional in update)
  if (password && password.trim().length > 0) {
    if (password.length < 8 || password.length > 16) {
      errors.push('Password must be between 8 and 16 characters.');
    } else {
      const hasUppercase = /[A-Z]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      if (!hasUppercase) {
        errors.push('Password must include at least one uppercase letter.');
      }
      if (!hasSpecialChar) {
        errors.push('Password must include at least one special character.');
      }
    }
  }

  // Address validation
  if (!address || address.length > 400) {
    errors.push('Address is required and cannot exceed 400 characters.');
  }

  // Role validation
  if (!role || !['admin', 'normal', 'owner'].includes(role)) {
    errors.push('Invalid user role specified.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // Check if email already exists on a different user
    const existingUser = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email is already taken by another account.' });
    }

    if (password && password.trim().length > 0) {
      // Update with new password
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET name = ?, email = ?, password = ?, address = ?, role = ? WHERE id = ?',
        [name, email, hashedPassword, address, role, userId]
      );
    } else {
      // Update without password
      await db.query(
        'UPDATE users SET name = ?, email = ?, address = ?, role = ? WHERE id = ?',
        [name, email, address, role, userId]
      );
    }

    return res.json({ message: 'User details updated successfully!' });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: 'Failed to update user details.' });
  }
};

// 8. Delete User (Admin only)
exports.deleteUser = async (req, res) => {
  const userId = parseInt(req.params.id);
  const adminId = req.user.id;

  if (userId === adminId) {
    return res.status(400).json({ error: 'You cannot delete your own admin account.' });
  }

  try {
    const users = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
    if (users.length > 0 && users[0].email === 'admin@gmail.com') {
      return res.status(400).json({ error: 'The primary system admin account cannot be deleted.' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    return res.json({ message: 'User deleted successfully!' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
};

// 9. Update Store (Admin only)
exports.updateStore = async (req, res) => {
  const storeId = parseInt(req.params.id);
  const { name, address, ownerId } = req.body;
  const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const errors = [];
  if (!name || name.trim().length < 2 || name.trim().length > 60) {
    errors.push('Store Name must be between 2 and 60 characters.');
  }
  if (!ownerId) {
    errors.push('Store Owner selection is required.');
  }
  if (!address || address.length > 400) {
    errors.push('Address is required and cannot exceed 400 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const stores = await db.query('SELECT id, logo_url FROM stores WHERE id = ?', [storeId]);
    if (stores.length === 0) {
      return res.status(404).json({ error: 'Store outlet not found.' });
    }

    const owners = await db.query('SELECT email FROM users WHERE id = ?', [ownerId]);
    if (owners.length === 0) {
      return res.status(400).json({ error: 'Selected Store Owner does not exist.' });
    }
    const email = owners[0].email;

    const existingStoreByOwner = await db.query('SELECT id FROM stores WHERE owner_id = ? AND id != ?', [ownerId, storeId]);
    if (existingStoreByOwner.length > 0) {
      return res.status(400).json({ error: 'This Store Owner is already assigned to another store.' });
    }

    const existingStoreByEmail = await db.query('SELECT id FROM stores WHERE email = ? AND id != ?', [email, storeId]);
    if (existingStoreByEmail.length > 0) {
      return res.status(400).json({ error: 'A store with this owner\'s email is already registered.' });
    }

    if (logoUrl) {
      await db.query(
        'UPDATE stores SET name = ?, email = ?, address = ?, logo_url = ?, owner_id = ? WHERE id = ?',
        [name, email, address, logoUrl, parseInt(ownerId), storeId]
      );
    } else {
      await db.query(
        'UPDATE stores SET name = ?, email = ?, address = ?, owner_id = ? WHERE id = ?',
        [name, email, address, parseInt(ownerId), storeId]
      );
    }

    // Send email using Nodemailer
    const ownersData = await db.query('SELECT name, email, is_verified, verification_code FROM users WHERE id = ?', [ownerId]);
    if (ownersData.length > 0) {
      const owner = ownersData[0];
      let messageText = `Hello ${owner.name},\n\nYour assigned store outlet details have been updated.\nStore Name: ${name}\nLocation: ${address}\nOwner Name: ${owner.name}\nOwner Email: ${owner.email}`;
      let messageHtml = `<div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
         <h2 style="color: #6366f1;">Store Outlet Updated</h2>
         <p>Hello <strong>${owner.name}</strong>,</p>
         <p>Your assigned store outlet has been updated:</p>
         <div style="padding: 15px; background: #f3f4f6; border-radius: 8px; margin: 15px 0;">
           <strong>Store Name:</strong> ${name}<br/>
           <strong>Store Address:</strong> ${address}<br/>
           <strong>Owner Name:</strong> ${owner.name}<br/>
           <strong>Owner Email / Store Email:</strong> ${owner.email}
         </div>
      `;
      messageHtml += `</div>`;
      await sendMail(owner.email, `Store Details Updated: ${name} - StoreRating`, messageText, messageHtml);
    }

    return res.json({ message: 'Store outlet updated successfully!' });
  } catch (err) {
    console.error('Update store error:', err);
    return res.status(500).json({ error: 'Failed to update store outlet.' });
  }
};

// 10. Delete Store (Admin only)
exports.deleteStore = async (req, res) => {
  const storeId = parseInt(req.params.id);

  try {
    const stores = await db.query('SELECT id FROM stores WHERE id = ?', [storeId]);
    if (stores.length === 0) {
      return res.status(404).json({ error: 'Store outlet not found.' });
    }

    await db.query('DELETE FROM stores WHERE id = ?', [storeId]);

    return res.json({ message: 'Store outlet deleted successfully!' });
  } catch (err) {
    console.error('Delete store error:', err);
    return res.status(500).json({ error: 'Failed to delete store outlet.' });
  }
};

// 11. Get list of all ratings with sorting and search filters
exports.getRatings = async (req, res) => {
  const { search = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

  const allowedSortFields = ['store_name', 'user_name', 'rating', 'created_at'];
  const cleanSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const cleanSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  try {
    let sql = `
      SELECT 
        r.id, r.rating, r.created_at,
        s.name as store_name,
        u.name as user_name
      FROM ratings r
      JOIN stores s ON r.store_id = s.id
      JOIN users u ON r.user_id = u.id
    `;
    const params = [];

    if (search.trim()) {
      sql += ` WHERE s.name LIKE ? OR u.name LIKE ?`;
      const likeParam = `%${search}%`;
      params.push(likeParam, likeParam);
    }

    if (cleanSortBy === 'store_name') {
      sql += ` ORDER BY s.name ${cleanSortOrder}`;
    } else if (cleanSortBy === 'user_name') {
      sql += ` ORDER BY u.name ${cleanSortOrder}`;
    } else {
      sql += ` ORDER BY r.${cleanSortBy} ${cleanSortOrder}`;
    }

    const ratings = await db.query(sql, params);
    return res.json(ratings);
  } catch (err) {
    console.error('Get ratings error:', err);
    return res.status(500).json({ error: 'Failed to retrieve ratings list.' });
  }
};

// 12. Delete Rating (Admin only)
exports.deleteRating = async (req, res) => {
  const ratingId = parseInt(req.params.id);

  try {
    const ratings = await db.query('SELECT id FROM ratings WHERE id = ?', [ratingId]);
    if (ratings.length === 0) {
      return res.status(404).json({ error: 'Rating not found.' });
    }

    await db.query('DELETE FROM ratings WHERE id = ?', [ratingId]);

    return res.json({ message: 'Rating deleted successfully!' });
  } catch (err) {
    console.error('Delete rating error:', err);
    return res.status(500).json({ error: 'Failed to delete rating.' });
  }
};

