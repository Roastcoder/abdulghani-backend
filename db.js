const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:              'srv1743.hstgr.io',
  user:              'u463483684_abdul',
  password:          'Abdulghani2828',
  database:          'u463483684_abdul_gani_sho',
  port:              3306,
  waitForConnections: true,
  connectionLimit:   10,
  connectTimeout:    10000,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ Database connected — u463483684_abdul_gani_sho @ srv1743.hstgr.io`);
    conn.release();
  } catch (err) {
    console.error(`❌ Database connection failed — ${err.message}`);
  }
}

testConnection();

module.exports = pool;
