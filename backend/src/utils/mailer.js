const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendMail = async (to, subject, text, html) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"StoreRating Platform" <noreply@storerating.com>',
    to,
    subject,
    text,
    html
  };

  // Safe fallback if SMTP settings are missing
  if (!process.env.SMTP_HOST) {
    console.log('\n=================== EMAIL EMULATION ===================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message:\n${text}`);
    console.log('========================================================\n');
    return { emulated: true, message: 'Email logged to console (SMTP not configured).' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    return { error: error.message };
  }
};

module.exports = { sendMail };
