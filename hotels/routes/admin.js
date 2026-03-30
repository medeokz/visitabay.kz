const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { loadAmenities } = require('../utils/loadAmenities');
const { requireAdmin } = require('../middleware/auth');
const { adminPublicUrl, basePath } = require('../utils/adminPublicUrl');

function bp(req) {
  return req.app.locals.basePath || '';
}

// Страница входа (общая для админа и хозяев)
router.get('/login', (req, res) => {
  if (req.session?.admin) {
    const to =
      req.session.admin.role === 'owner'
        ? basePath(req) + '/owner'
        : (basePath(req).replace(/\/$/, '') + '/admin');
    return res.redirect(to);
  }
  res.render('admin/login', { error: null });
});

// Вход
router.post('/login', async (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) {
    return res.render('admin/login', { error: 'Введите логин и пароль' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, login, password_hash, role FROM admin_users WHERE login = ?',
      [login.trim()]
    );
    if (!rows.length) {
      return res.render('admin/login', { error: 'Неверный логин или пароль' });
    }
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) {
      return res.render('admin/login', { error: 'Неверный логин или пароль' });
    }
    const role = rows[0].role || 'admin';
    req.session.admin = { id: rows[0].id, login: rows[0].login, role };
    res.redirect(
      role === 'owner' ? basePath(req) + '/owner' : (basePath(req).replace(/\/$/, '') + '/admin')
    );
  } catch (err) {
    console.error(err);
    res.render('admin/login', { error: 'Ошибка входа' });
  }
});

// Выход
router.get('/logout', (req, res) => {
  req.session.destroy(() => {});
  res.redirect(adminPublicUrl(req, 'login'));
});

// Бронирования (все) — строго до любых /:id
router.get('/bookings', requireAdmin, async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT b.*, h.name AS hotel_name, r.name AS room_name FROM bookings b
       JOIN hotels h ON h.id = b.hotel_id
       LEFT JOIN hotel_rooms r ON r.id = b.room_id
       ORDER BY b.created_at DESC`
    );
    res.render('admin/bookings', { bookings, isOwner: false });
  } catch (err) {
    console.error(err);
    res.render('admin/bookings', { bookings: [], error: 'Ошибка загрузки', isOwner: false });
  }
});

// Хозяева — строго до любых /:id
router.get('/owners', requireAdmin, async (req, res) => {
  try {
    const [owners] = await pool.query(
      "SELECT id, login, created_at FROM admin_users WHERE role = 'owner' ORDER BY login"
    );
    const [pendingRequests] = await pool.query(
      "SELECT id, login, name, phone, hotel_name, message, created_at FROM owner_registration_requests WHERE status = 'pending' ORDER BY created_at DESC"
    );
    res.render('admin/owners', {
      owners,
      pendingRequests: pendingRequests || [],
      error: req.query.error || null,
      ok: req.query.ok || null,
    });
  } catch (err) {
    console.error(err);
    res.render('admin/owners', { owners: [], pendingRequests: [], error: 'Ошибка загрузки' });
  }
});

// Одобрить заявку хозяина (модерация)
router.post('/owners/approve/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.redirect(adminPublicUrl(req, 'owners?error=Неверный id'));
  try {
    const [rows] = await pool.query(
      "SELECT id, login, password_hash FROM owner_registration_requests WHERE id = ? AND status = 'pending'",
      [id]
    );
    if (!rows.length)
      return res.redirect(
        adminPublicUrl(req, 'owners?error=Заявка не найдена или уже обработана')
      );
    const { login, password_hash } = rows[0];
    const [existing] = await pool.query('SELECT id FROM admin_users WHERE login = ?', [login]);
    if (existing.length) {
      await pool.query("UPDATE owner_registration_requests SET status = 'rejected', moderated_at = NOW(), admin_notes = 'Логин уже занят' WHERE id = ?", [id]);
      return res.redirect(
        adminPublicUrl(req, 'owners?error=Пользователь с таким логином уже есть')
      );
    }
    await pool.query(
      "INSERT INTO admin_users (login, password_hash, role) VALUES (?, ?, 'owner')",
      [login, password_hash]
    );
    await pool.query("UPDATE owner_registration_requests SET status = 'approved', moderated_at = NOW() WHERE id = ?", [id]);
    res.redirect(adminPublicUrl(req, 'owners?ok=1'));
  } catch (err) {
    console.error(err);
    res.redirect(adminPublicUrl(req, 'owners?error=Ошибка одобрения'));
  }
});

// Отклонить заявку хозяина
router.post('/owners/reject/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.redirect(adminPublicUrl(req, 'owners?error=Неверный id'));
  try {
    const adminNotes = (req.body && req.body.admin_notes) ? String(req.body.admin_notes).trim().slice(0, 500) : null;
    await pool.query(
      "UPDATE owner_registration_requests SET status = 'rejected', moderated_at = NOW(), admin_notes = ? WHERE id = ?",
      [adminNotes || null, id]
    );
    res.redirect(adminPublicUrl(req, 'owners?ok=rejected'));
  } catch (err) {
    console.error(err);
    res.redirect(adminPublicUrl(req, 'owners?error=Ошибка отклонения'));
  }
});

// Админка: список гостиниц
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [hotels] = await pool.query('SELECT * FROM hotels ORDER BY name');
    res.render('admin/hotels', { hotels });
  } catch (err) {
    console.error(err);
    res.render('admin/hotels', { hotels: [], error: 'Ошибка загрузки' });
  }
});

// Форма добавления
router.get('/add', requireAdmin, (req, res) => {
  const list = loadAmenities() || [];
  res.render('admin/hotel-form', { hotel: null, amenitiesList: list, rooms: [] });
});

// Форма редактирования
router.get('/edit/:id', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hotels WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.redirect(adminPublicUrl(req));
    const [amenRows] = await pool.query(
      'SELECT amenity_key FROM hotel_amenities WHERE hotel_id = ?',
      [req.params.id]
    );
    const [roomRows] = await pool.query(
      'SELECT id, name, price, image_urls, sort_order, i18n FROM hotel_rooms WHERE hotel_id = ? ORDER BY sort_order ASC, id ASC',
      [req.params.id]
    );
    const hotel = rows[0];
    hotel.amenities = Array.isArray(amenRows) ? amenRows.map((r) => r.amenity_key) : [];
    hotel.rooms = (Array.isArray(roomRows) ? roomRows : []).map((r) => {
      let urls = [];
      if (r.image_urls != null) {
        try {
          urls = typeof r.image_urls === 'string' ? JSON.parse(r.image_urls) : r.image_urls;
          if (!Array.isArray(urls)) urls = [];
        } catch (_) {}
      }
      let ri18n = {};
      if (r.i18n != null) {
        try {
          ri18n = typeof r.i18n === 'string' ? JSON.parse(r.i18n) : r.i18n;
          if (!ri18n || typeof ri18n !== 'object') ri18n = {};
        } catch (_) {
          ri18n = {};
        }
      }
      return { id: r.id, name: r.name, price: r.price, image_urls: urls, sort_order: r.sort_order, i18n: ri18n };
    });
    if (hotel.image_urls != null) {
      try { hotel.image_urls = typeof hotel.image_urls === 'string' ? JSON.parse(hotel.image_urls) : hotel.image_urls; }
      catch (_) { hotel.image_urls = []; }
      if (!Array.isArray(hotel.image_urls)) hotel.image_urls = [];
    } else hotel.image_urls = hotel.image_url ? [hotel.image_url] : [];
    const list = loadAmenities() || [];
    res.render('admin/hotel-form', { hotel, amenitiesList: list });
  } catch (err) {
    res.redirect(adminPublicUrl(req));
  }
});

router.post('/owners', requireAdmin, async (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password || !login.trim()) {
    return res.redirect(adminPublicUrl(req, 'owners?error=Введите логин и пароль'));
  }
  try {
    const hash = await require('bcryptjs').hash(password, 10);
    await pool.query(
      "INSERT INTO admin_users (login, password_hash, role) VALUES (?, ?, 'owner')",
      [login.trim(), hash]
    );
    res.redirect(adminPublicUrl(req, 'owners?ok=1'));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.redirect(adminPublicUrl(req, 'owners?error=Такой логин уже есть'));
    }
    res.redirect(adminPublicUrl(req, 'owners?error=Ошибка создания'));
  }
});

module.exports = router;
