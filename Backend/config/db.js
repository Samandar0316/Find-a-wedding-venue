const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log('PostgreSQL bazasiga muvaffaqiyatli ulandi'))
  .catch((err) => console.error('❌ Ulanishda xatolik:', err));

module.exports = pool;
