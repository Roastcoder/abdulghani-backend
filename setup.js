require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setup() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    multipleStatements: true,
  });

  const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
  await conn.query(sql);

  console.log('Database setup completed successfully!');
  console.log('Admin credentials - Username: admin, Password: admin123');
  await conn.end();
}

setup().catch(console.error);
