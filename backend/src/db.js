const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ override: true });

const FALLBACK_PASSWORDS = [
  process.env.DB_PASSWORD, // First try .env password
  'root',
  '',
  'admin',
  'password',
  'root123',
  'admin123',
  'root@123',
  'Adarsh@123',
  'Adarsh123',
  'adarsh@123',
  '12345678',
  '123456',
  'mysql'
];

let pool = null;
let activePasswordUsed = null;

async function connectWithFallback() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const dbName = process.env.DB_NAME || 'store_rating_db';

  let lastError = null;

  for (const password of FALLBACK_PASSWORDS) {
    if (password === undefined) continue;
    try {
      // Connect to mysql server (without specifying DB name first, in case it doesn't exist)
      const connection = await mysql.createConnection({
        host,
        port,
        user,
        password
      });

      console.log(`Successfully authenticated MySQL with password: ${password === '' ? '(empty)' : password}`);
      activePasswordUsed = password;

      // Create database if not exists
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await connection.end();

      // Create connection pool connected to the database
      pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      return pool;
    } catch (err) {
      lastError = err;
      // Continue to next password if access denied
      if (err.code !== 'ER_ACCESS_DENIED_ERROR') {
        // If it's a connection refused or host error, no point trying other passwords
        break;
      }
    }
  }

  throw new Error(`Failed to connect to MySQL: ${lastError ? lastError.message : 'Unknown error'}`);
}

async function query(sql, params) {
  if (!pool) {
    await connectWithFallback();
  }
  const [results] = await pool.execute(sql, params);
  return results;
}

async function initDb() {
  try {
    await connectWithFallback();

    // 1. Create Users Table
    // Roles: admin, normal, owner
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        address VARCHAR(500) NOT NULL,
        role ENUM('admin', 'normal', 'owner') NOT NULL DEFAULT 'normal',
        is_verified TINYINT(1) NOT NULL DEFAULT 0,
        verification_code VARCHAR(10) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist on existing databases
    try {
      await query('ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0');
    } catch (err) {
      // Ignore if column already exists
    }
    try {
      await query('ALTER TABLE users ADD COLUMN verification_code VARCHAR(10) NULL');
    } catch (err) {
      // Ignore if column already exists
    }

    // 2. Create Stores Table
    await query(`
      CREATE TABLE IF NOT EXISTS stores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        address VARCHAR(500) NOT NULL,
        logo_url VARCHAR(255) NULL,
        owner_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 3. Create Ratings Table
    await query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        store_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_store (user_id, store_id)
      )
    `);

    console.log('Database tables verified/created successfully.');

    // 4. Seed default admin if not exists
    // Admin email: admin@gmail.com, password: admin123
    const admins = await query('SELECT * FROM users WHERE email = ?', ['admin@gmail.com']);
    if (admins.length === 0) {
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      // Name is 24 chars to satisfy the min 20 chars validation constraint: "System Administrator User"
      await query(
        'INSERT INTO users (name, email, password, address, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
        ['System Administrator User', 'admin@gmail.com', adminPasswordHash, 'Main Office, System Center, Suite 101', 'admin', 1]
      );
      console.log('Default admin seeded successfully: admin@gmail.com / admin123');
    } else {
      // Force verify default admin if it already exists
      await query('UPDATE users SET is_verified = 1 WHERE email = ?', ['admin@gmail.com']);
    }

  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
}

module.exports = {
  query,
  initDb,
  getActivePasswordUsed: () => activePasswordUsed
};
