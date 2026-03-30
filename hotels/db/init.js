const pool = require('../config/db');
const { hotelSlug } = require('../utils/slug');

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hotels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) DEFAULT NULL,
        price VARCHAR(100) DEFAULT NULL,
        phone VARCHAR(100) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        owner_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        login VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(
      "ALTER TABLE hotels ADD COLUMN owner_id INT DEFAULT NULL"
    ).catch(() => {});
    await pool.query(
      "ALTER TABLE admin_users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'admin'"
    ).catch(() => {});
    await pool.query(
      "ALTER TABLE hotels ADD COLUMN image_urls JSON DEFAULT NULL"
    ).catch(() => {});
    await pool.query(
      "ALTER TABLE hotels ADD COLUMN map_link VARCHAR(500) DEFAULT NULL"
    ).catch(() => {});
    await pool.query(
      "ALTER TABLE hotels ADD COLUMN slug VARCHAR(255) DEFAULT NULL"
    ).catch(() => {});
    await pool.query(
      "ALTER TABLE hotels ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL"
    ).catch(() => {});
    await pool.query(
      "ALTER TABLE hotels ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL"
    ).catch(() => {});
    try {
      const [rows] = await pool.query('SELECT id, name, slug FROM hotels');
      for (const row of rows || []) {
        if (row.slug == null || row.slug === '') {
          const slug = hotelSlug(row.name, row.id);
          await pool.query('UPDATE hotels SET slug = ? WHERE id = ?', [slug, row.id]);
        }
      }
    } catch (e) {
      console.warn('Slug backfill:', e.message);
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hotel_amenities (
        hotel_id INT NOT NULL,
        amenity_key VARCHAR(50) NOT NULL,
        PRIMARY KEY (hotel_id, amenity_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hotel_id INT NOT NULL,
        room_id INT DEFAULT NULL,
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255) NOT NULL,
        guest_phone VARCHAR(100) NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        adults INT NOT NULL DEFAULT 1,
        children INT NOT NULL DEFAULT 0,
        notes TEXT DEFAULT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(
      'ALTER TABLE bookings ADD COLUMN room_id INT DEFAULT NULL'
    ).catch(() => {});
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        endpoint VARCHAR(500) NOT NULL,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_owner_endpoint (owner_id, endpoint(191))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hotel_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hotel_id INT NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        rating TINYINT DEFAULT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_hotel_id (hotel_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hotel_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hotel_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        price VARCHAR(100) DEFAULT NULL,
        image_urls JSON DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        KEY idx_hotel_id (hotel_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await pool.query(
      "ALTER TABLE hotel_rooms ADD COLUMN image_urls TEXT DEFAULT NULL"
    ).catch(() => {});
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alakol_bases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL,
        price VARCHAR(100) DEFAULT NULL,
        phone VARCHAR(100) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        image_urls JSON DEFAULT NULL,
        map_link VARCHAR(500) DEFAULT NULL,
        latitude DECIMAL(10, 8) DEFAULT NULL,
        longitude DECIMAL(11, 8) DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_published TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    try {
      const [alakolRows] = await pool.query('SELECT id, name, slug FROM alakol_bases');
      for (const row of alakolRows || []) {
        if (row.slug == null || row.slug === '') {
          const slug = hotelSlug(row.name, row.id);
          await pool.query('UPDATE alakol_bases SET slug = ? WHERE id = ?', [slug, row.id]);
        }
      }
    } catch (e) {
      console.warn('Alakol slug backfill:', e.message);
    }
    await pool.query('ALTER TABLE hotels ADD COLUMN i18n JSON DEFAULT NULL').catch(() => {});
    await pool.query('ALTER TABLE alakol_bases ADD COLUMN i18n JSON DEFAULT NULL').catch(() => {});
    await pool.query('ALTER TABLE hotel_rooms ADD COLUMN i18n JSON DEFAULT NULL').catch(() => {});
    await pool.query(`
      CREATE TABLE IF NOT EXISTS owner_registration_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        login VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) DEFAULT NULL,
        phone VARCHAR(100) DEFAULT NULL,
        hotel_name VARCHAR(255) DEFAULT NULL,
        message TEXT DEFAULT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        admin_notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        moderated_at TIMESTAMP NULL DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Tables ready');
  } catch (err) {
    console.error('Init DB error:', err.message);
    throw err;
  }
}

module.exports = { initDb };
