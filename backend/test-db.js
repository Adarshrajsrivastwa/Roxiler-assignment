const mysql = require('mysql2/promise');
require('dotenv').config({ override: true });

console.log('ENV DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('ENV DB_USER:', process.env.DB_USER);
console.log('ENV DB_HOST:', process.env.DB_HOST);

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD
    });
    console.log('Success connecting to MySQL server!');
    const [rows] = await conn.query('SHOW DATABASES;');
    console.log('Databases:', rows);
    await conn.end();
  } catch (err) {
    console.error('Error connecting:', err);
  }
}

test();
