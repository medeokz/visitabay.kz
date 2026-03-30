require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const pool = require('./config/db');
const { initDb } = require('./db/init');
const apiHotels = require('./routes/api/hotels');
const apiBookings = require('./routes/api/bookings');
const apiPush = require('./routes/api/push');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const ownerRoutes = require('./routes/owner');
const { normalizeLang, COOKIE_NAME } = require('./utils/i18n');

const app = express();
const PORT = process.env.PORT || 3000;
// Базовый путь, если приложение отдаётся по подпути (напр. /visitabay.kz/hotels)
const basePath = (process.env.BASE_PATH || '').replace(/\/$/, '');
// Публичный префикс админки за единым прокси (express-migration /hotels-admin → сюда /admin)
const browserAdminBase = (process.env.BROWSER_ADMIN_BASE || '').trim().replace(/\/$/, '') || null;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.basePath = basePath; // для ссылок в шаблонах при работе по подпути
app.locals.browserAdminBase = browserAdminBase;
// Публичный префикс ссылок внутри админки (/hotels-admin/... или /admin/...)
app.use((req, res, next) => {
  const bp = app.locals.basePath || '';
  const bar = app.locals.browserAdminBase;
  res.locals.adminWebRoot = bar ? String(bar).replace(/\/$/, '') : `${bp}/admin`;
  next();
});
// Статика: public (в т.ч. /visitabay/, /uploads/, /css/)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
if (basePath) app.use(basePath, express.static(publicDir));

// API
app.use(basePath + '/api/hotels', apiHotels);
app.use(basePath + '/api/bookings', apiBookings);
app.use(basePath + '/api/push', apiPush);
app.use(basePath + '/api/upload', uploadRoutes);

// Админка и кабинет хозяина гостиницы
// Явная регистрация /admin/bookings и /admin/owners (иначе в части окружений матчится /edit/:id)
app.get(basePath + '/admin/bookings', (req, res, next) => {
  req.url = '/bookings';
  adminRoutes(req, res, next);
});
app.get(basePath + '/admin/owners', (req, res, next) => {
  req.url = '/owners';
  adminRoutes(req, res, next);
});
app.use(basePath + '/admin', adminRoutes);
// Явная регистрация страниц регистрации хозяев (иначе GET может не матчиться)
app.get(basePath + '/owner/register', (req, res, next) => {
  req.url = '/register';
  ownerRoutes(req, res, next);
});
app.get(basePath + '/owner/register/success', (req, res, next) => {
  req.url = '/register/success';
  ownerRoutes(req, res, next);
});
app.use(basePath + '/owner', ownerRoutes);

// Нормализация URL картинки: относительные пути делаем абсолютными от корня сайта
function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const s = url.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith('/') ? s : '/' + s;
}

// Заглушка «Нет фото» — data URL и внешний URL на случай проблем с data: в атрибутах
const FALLBACK_HOTEL_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#2a2a2a" width="400" height="300"/><text fill="#888" x="200" y="155" text-anchor="middle" font-size="18" font-family="sans-serif">Нет фото</text></svg>'
);
const FALLBACK_HOTEL_IMAGE_HTTPS = 'https://placehold.co/600x340/2a2a2a/888?text=%D0%9D%D0%B5%D1%82+%D1%84%D0%BE%D1%82%D0%BE';
app.locals.fallbackHotelImage = FALLBACK_HOTEL_IMAGE;
app.locals.fallbackHotelImageHttps = FALLBACK_HOTEL_IMAGE_HTTPS;

// Публичные страницы
app.get(basePath + '/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, slug, location, price, address, latitude, longitude, image_url, image_urls FROM hotels ORDER BY name'
    );
    const hotels = (rows || []).map((h) => {
      let urls = [];
      if (h.image_urls != null) {
        try {
          urls = typeof h.image_urls === 'string' ? JSON.parse(h.image_urls) : h.image_urls;
          if (!Array.isArray(urls)) urls = [];
        } catch (_) {}
      }
      if (!urls.length && h.image_url) urls = [h.image_url];
      if (!urls.length) urls = [FALLBACK_HOTEL_IMAGE_HTTPS];
      urls = urls.filter(Boolean).map(normalizeImageUrl).filter(Boolean);
      if (!urls.length) urls = [FALLBACK_HOTEL_IMAGE_HTTPS];
      return { ...h, image_urls: urls };
    });
    const [ratingRows] = await pool.query(
      'SELECT hotel_id, ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count FROM hotel_reviews WHERE rating IS NOT NULL GROUP BY hotel_id'
    );
    const ratingByHotel = {};
    (ratingRows || []).forEach((r) => {
      ratingByHotel[r.hotel_id] = { avgRating: parseFloat(r.avg_rating), reviewCount: r.review_count };
    });
    hotels.forEach((h) => {
      const r = ratingByHotel[h.id];
      h.avgRating = r ? r.avgRating : null;
      h.reviewCount = r ? r.reviewCount : 0;
    });
    const mapCenter = { lat: 50.4114, lng: 80.2275 };
    res.render('index', { hotels, mapCenter, basePath: basePath || '', fallbackHotelImage: FALLBACK_HOTEL_IMAGE, fallbackHotelImageHttps: FALLBACK_HOTEL_IMAGE_HTTPS });
  } catch (err) {
    console.error(err);
    res.render('index', { hotels: [], error: 'Ошибка загрузки', mapCenter: { lat: 50.4114, lng: 80.2275 }, basePath: basePath || '', fallbackHotelImage: FALLBACK_HOTEL_IMAGE, fallbackHotelImageHttps: FALLBACK_HOTEL_IMAGE_HTTPS });
  }
});

app.get(basePath + '/hotel/:slug', async (req, res) => {
  try {
    const slugOrId = req.params.slug;
    let rows;
    if (/^\d+$/.test(slugOrId)) {
      rows = (await pool.query('SELECT * FROM hotels WHERE id = ?', [slugOrId]))[0];
      if (rows.length) {
        const hotel = rows[0];
        if (hotel.slug) return res.redirect(302, (basePath || '') + '/hotel/' + encodeURIComponent(hotel.slug));
      }
    }
    if (!rows || !rows.length) {
      rows = (await pool.query('SELECT * FROM hotels WHERE slug = ?', [slugOrId]))[0];
    }
    if (!rows || !rows.length) return res.redirect(basePath || '/');
    const hotel = rows[0];
    let imageUrls = [];
    if (hotel.image_urls != null) {
      try {
        imageUrls = typeof hotel.image_urls === 'string' ? JSON.parse(hotel.image_urls) : hotel.image_urls;
        if (!Array.isArray(imageUrls)) imageUrls = [];
      } catch (_) {}
    }
    if (!imageUrls.length && hotel.image_url) imageUrls = [hotel.image_url];
    if (!imageUrls.length) imageUrls = [FALLBACK_HOTEL_IMAGE];
    imageUrls = imageUrls.filter(Boolean).map(normalizeImageUrl).filter(Boolean);
    if (!imageUrls.length) imageUrls = [FALLBACK_HOTEL_IMAGE];
    hotel.image_urls = imageUrls;
    hotel.image_url = imageUrls[0];
    const [amenRows] = await pool.query(
      'SELECT amenity_key FROM hotel_amenities WHERE hotel_id = ?',
      [hotel.id]
    );
    const amenitiesKeys = Array.isArray(amenRows) ? amenRows.map((r) => r.amenity_key) : [];
    const { labelsForAmenityKeys } = require('./utils/amenityLabels');
    const loc =
      normalizeLang(req.query && req.query.lang) ||
      normalizeLang(req.cookies && req.cookies[COOKIE_NAME]) ||
      'kk';
    const amenitiesLabels = labelsForAmenityKeys(amenitiesKeys, loc);

    const [relatedRows] = await pool.query(
      'SELECT id, name, slug, location, price, image_url FROM hotels WHERE id != ? ORDER BY id LIMIT 5',
      [hotel.id]
    );
    const relatedHotels = (relatedRows || []).map((r) => ({
      ...r,
      image_url: r.image_url ? normalizeImageUrl(r.image_url) : FALLBACK_HOTEL_IMAGE,
    }));

    const [roomRows] = await pool.query(
      'SELECT id, name, price, image_urls, sort_order FROM hotel_rooms WHERE hotel_id = ? ORDER BY sort_order ASC, id ASC',
      [hotel.id]
    );
    const hotelRooms = (roomRows || []).map((r) => {
      let urls = [];
      if (r.image_urls != null) {
        try {
          urls = typeof r.image_urls === 'string' ? JSON.parse(r.image_urls) : r.image_urls;
          if (!Array.isArray(urls)) urls = [];
        } catch (_) {}
      }
      return { name: r.name, price: r.price, image_urls: urls.filter(Boolean) };
    });

    const [reviewRows] = await pool.query(
      'SELECT id, author_name, rating, text, created_at FROM hotel_reviews WHERE hotel_id = ? ORDER BY created_at DESC',
      [hotel.id]
    );
    const reviews = (reviewRows || []).map((r) => ({
      ...r,
      created_at: r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
    }));
    const withRating = (reviewRows || []).filter((r) => r.rating != null);
    const avgRating = withRating.length
      ? Math.round((withRating.reduce((s, r) => s + Number(r.rating), 0) / withRating.length) * 10) / 10
      : null;
    const reviewCount = (reviewRows || []).length;

    res.render('hotel', {
      hotel: { ...hotel, amenitiesLabels, avgRating, reviewCount, rooms: hotelRooms },
      relatedHotels,
      reviews,
      basePath: basePath || '',
      lang: loc
    });
  } catch (err) {
    res.redirect(basePath || '/');
  }
});

const postReviewHandler = async (req, res) => {
  try {
    const body = req.body || {};
    const { hotel_id, author_name, rating, text } = body;
    const hotelId = hotel_id != null ? parseInt(hotel_id, 10) : NaN;
    const name = (author_name && String(author_name).trim()) || '';
    const reviewText = (text && String(text).trim()) || '';
    if (!hotelId || isNaN(hotelId)) {
      return res.status(400).json({ error: 'Не указана гостиница. Обновите страницу и попробуйте снова.' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Укажите ваше имя.' });
    }
    if (!reviewText) {
      return res.status(400).json({ error: 'Напишите текст отзыва.' });
    }
    const ratingVal = rating != null && rating !== '' ? Math.min(5, Math.max(1, parseInt(rating, 10))) : null;
    await pool.query(
      'INSERT INTO hotel_reviews (hotel_id, author_name, rating, text) VALUES (?, ?, ?, ?)',
      [hotelId, name, ratingVal, reviewText]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('Ошибка сохранения отзыва:', err);
    return res.status(500).json({ error: 'Ошибка сохранения отзыва. Попробуйте позже.' });
  }
};

app.post(basePath + '/api/reviews', postReviewHandler);
if (basePath) app.post('/api/reviews', postReviewHandler);

async function ensureAdminUser() {
  const login = process.env.ADMIN_LOGIN || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const [rows] = await pool.query('SELECT id FROM admin_users WHERE login = ?', [
    login,
  ]);
  if (rows.length) return;
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO admin_users (login, password_hash, role) VALUES (?, ?, 'admin')",
    [login, hash]
  );
  console.log('Admin user created:', login);
}

async function start() {
  try {
    await initDb();
    await ensureAdminUser();
    app.listen(PORT, () => {
      const root = `http://localhost:${PORT}${basePath}`;
      console.log(
        `Сервер: ${root}\nАдминка: ${root}/admin\nХозяева: ${root}/owner`
      );
    });
  } catch (err) {
    console.error('Start failed:', err);
    process.exit(1);
  }
}

start();
