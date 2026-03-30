const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { loadAmenities } = require('../utils/loadAmenities');
const { requireOwner } = require('../middleware/auth');
const { adminPublicUrl } = require('../utils/adminPublicUrl');

function bp(req) {
  return req.app.locals.basePath || '';
}

// Регистрация хозяина гостиницы (публичная, без авторизации)
router.get('/register', (req, res) => {
  if (req.session?.admin?.role === 'owner') return res.redirect(bp(req) + '/owner');
  if (req.session?.admin?.role === 'admin') return res.redirect(adminPublicUrl(req));
  res.render('owner-register', { error: null, basePath: bp(req) });
});

router.post('/register', async (req, res) => {
  if (req.session?.admin) return res.redirect(bp(req) + '/owner');
  const { login, password, name, phone, hotel_name, message } = req.body || {};
  const loginTrim = (login || '').trim();
  const pass = (password || '').trim();
  if (!loginTrim || !pass) {
    return res.render('owner-register', {
      error: 'Укажите логин (email) и пароль',
      basePath: bp(req),
      values: { login: loginTrim, name: (name || '').trim(), phone: (phone || '').trim(), hotel_name: (hotel_name || '').trim(), message: (message || '').trim() },
    });
  }
  if (pass.length < 6) {
    return res.render('owner-register', {
      error: 'Пароль должен быть не менее 6 символов',
      basePath: bp(req),
      values: { login: loginTrim, name: (name || '').trim(), phone: (phone || '').trim(), hotel_name: (hotel_name || '').trim(), message: (message || '').trim() },
    });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM admin_users WHERE login = ?', [loginTrim]);
    if (existing.length) {
      return res.render('owner-register', {
        error: 'Пользователь с таким логином уже зарегистрирован. Войдите или укажите другой логин.',
        basePath: bp(req),
        values: { login: loginTrim, name: (name || '').trim(), phone: (phone || '').trim(), hotel_name: (hotel_name || '').trim(), message: (message || '').trim() },
      });
    }
    const [pending] = await pool.query(
      "SELECT id FROM owner_registration_requests WHERE login = ? AND status = 'pending'",
      [loginTrim]
    );
    if (pending.length) {
      return res.render('owner-register', {
        error: 'По этому логину уже есть заявка на модерации. Дождитесь решения.',
        basePath: bp(req),
        values: { login: loginTrim, name: (name || '').trim(), phone: (phone || '').trim(), hotel_name: (hotel_name || '').trim(), message: (message || '').trim() },
      });
    }
    const hash = await bcrypt.hash(pass, 10);
    await pool.query(
      `INSERT INTO owner_registration_requests (login, password_hash, name, phone, hotel_name, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [loginTrim, hash, (name || '').trim() || null, (phone || '').trim() || null, (hotel_name || '').trim() || null, (message || '').trim() || null]
    );
    return res.redirect(bp(req) + '/owner/register/success');
  } catch (err) {
    console.error(err);
    res.render('owner-register', {
      error: 'Ошибка при отправке заявки. Попробуйте позже.',
      basePath: bp(req),
      values: { login: loginTrim, name: (name || '').trim(), phone: (phone || '').trim(), hotel_name: (hotel_name || '').trim(), message: (message || '').trim() },
    });
  }
});

router.get('/register/success', (req, res) => {
  res.render('owner-register-success', { basePath: bp(req) });
});

// Кабинет хозяина: только свои гостиницы + кол-во бронирований на подтверждении
router.get('/', requireOwner, async (req, res) => {
  try {
    const userId = req.session.admin.id;
    const [hotels] = await pool.query(
      'SELECT * FROM hotels WHERE owner_id = ? ORDER BY name',
      [userId]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM bookings b
       JOIN hotels h ON h.id = b.hotel_id AND h.owner_id = ?
       WHERE b.status = 'pending'`,
      [userId]
    );
    const pendingBookingsCount = (countRows[0] && countRows[0].cnt) || 0;
    res.render('admin/hotels', {
      hotels,
      isOwner: true,
      pendingBookingsCount,
    });
  } catch (err) {
    console.error(err);
    res.render('admin/hotels', { hotels: [], error: 'Ошибка загрузки', isOwner: true, pendingBookingsCount: 0 });
  }
});

router.get('/add', requireOwner, (req, res) => {
  const list = loadAmenities() || [];
  res.render('admin/hotel-form', { hotel: null, amenitiesList: list, isOwner: true });
});

// Бронирования — до /edit/:id, иначе "bookings" матчится как :id
router.get('/bookings', requireOwner, async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT b.*, h.name AS hotel_name, r.name AS room_name FROM bookings b
       JOIN hotels h ON h.id = b.hotel_id AND h.owner_id = ?
       LEFT JOIN hotel_rooms r ON r.id = b.room_id
       ORDER BY b.created_at DESC`,
      [req.session.admin.id]
    );
    res.render('admin/bookings', { bookings, isOwner: true });
  } catch (err) {
    console.error(err);
    res.render('admin/bookings', { bookings: [], error: 'Ошибка загрузки', isOwner: true });
  }
});

router.get('/edit/:id', requireOwner, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM hotels WHERE id = ? AND owner_id = ?',
      [req.params.id, req.session.admin.id]
    );
    if (!rows.length) return res.redirect(bp(req) + '/owner');
    const [amenRows] = await pool.query(
      'SELECT amenity_key FROM hotel_amenities WHERE hotel_id = ?',
      [req.params.id]
    );
    const [roomRows] = await pool.query(
      'SELECT id, name, price, image_urls, sort_order FROM hotel_rooms WHERE hotel_id = ? ORDER BY sort_order ASC, id ASC',
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
      return { id: r.id, name: r.name, price: r.price, image_urls: urls, sort_order: r.sort_order };
    });
    if (hotel.image_urls != null) {
      try { hotel.image_urls = typeof hotel.image_urls === 'string' ? JSON.parse(hotel.image_urls) : hotel.image_urls; }
      catch (_) { hotel.image_urls = []; }
      if (!Array.isArray(hotel.image_urls)) hotel.image_urls = [];
    } else hotel.image_urls = hotel.image_url ? [hotel.image_url] : [];
    const list = loadAmenities() || [];
    res.render('admin/hotel-form', { hotel, amenitiesList: list, isOwner: true });
  } catch (err) {
    res.redirect(bp(req) + '/owner');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {});
  res.redirect(adminPublicUrl(req, 'login'));
});

module.exports = router;
