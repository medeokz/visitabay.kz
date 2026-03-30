const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

// Тот же .env, что и у express-migration (hotels и express-migration — соседние папки).
const expressEnv = path.join(__dirname, '..', '..', 'express-migration', '.env');
if (fs.existsSync(expressEnv)) {
  require('dotenv').config({ path: expressEnv });
}
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.HOTELS_DB_USER || process.env.DB_USER || 'root',
  password:
    process.env.HOTELS_DB_PASSWORD !== undefined
      ? process.env.HOTELS_DB_PASSWORD
      : process.env.DB_PASSWORD || '',
  database: process.env.HOTELS_DB_NAME || process.env.DB_NAME || 'visitabay_hotels',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
