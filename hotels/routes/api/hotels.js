const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { loadAmenities } = require('../../utils/loadAmenities');
const { hotelSlug } = require('../../utils/slug');
const { normalizeI18nFromBody, normalizeRoomI18nFromBody } = require('../../utils/i18n');
const { requireAdmin, requireAuth } = require('../../middleware/auth');

function isAdmin(req) {
  return req.session?.admin?.role === 'admin';
}
function isOwner(req) {
  return req.session?.admin?.role === 'owner';
}
async function canEditHotel(req, hotelId) {
  if (isAdmin(req)) return true;
  if (!isOwner(req)) return false;
  const [rows] = await pool.query(
    'SELECT id FROM hotels WHERE id = ? AND owner_id = ?',
    [hotelId, req.session.admin.id]
  );
  return rows.length > 0;
}

async function getHotelAmenities(hotelId) {
  const [rows] = await pool.query(
    'SELECT amenity_key FROM hotel_amenities WHERE hotel_id = ?',
    [hotelId]
  );
  return rows.map((r) => r.amenity_key);
}

async function setHotelAmenities(hotelId, keys) {
  const keyList = Array.isArray(keys) ? keys : [];
  await pool.query('DELETE FROM hotel_amenities WHERE hotel_id = ?', [hotelId]);
  if (keyList.length === 0) return;
  const validKeys = new Set((loadAmenities() || []).map((a) => a.key));
  for (const key of keyList) {
    const k = String(key).trim();
    if (k && validKeys.has(k)) {
      await pool.query(
        'INSERT INTO hotel_amenities (hotel_id, amenity_key) VALUES (?, ?)',
        [hotelId, k]
      );
    }
  }
}

async function setHotelRooms(hotelId, roomsList) {
  const list = Array.isArray(roomsList) ? roomsList : [];
  await pool.query('DELETE FROM hotel_rooms WHERE hotel_id = ?', [hotelId]);
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const name = (r && r.name && String(r.name).trim()) || '';
    if (!name) continue;
    const price = (r && r.price != null) ? String(r.price).trim() : null;
    const imageUrls = Array.isArray(r && r.image_urls) ? r.image_urls.filter(Boolean).slice(0, 10) : [];
    const imageUrlsJson = JSON.stringify(imageUrls);
    const roomI18n = normalizeRoomI18nFromBody(r);
    await pool.query(
      'INSERT INTO hotel_rooms (hotel_id, name, price, image_urls, sort_order, i18n) VALUES (?, ?, ?, ?, ?, ?)',
      [hotelId, name, price || null, imageUrlsJson, i, roomI18n]
    );
  }
}

function parseImageUrls(row) {
  if (!row) return row;
  if (row.image_urls != null) {
    try {
      row.image_urls = typeof row.image_urls === 'string' ? JSON.parse(row.image_urls) : row.image_urls;
      if (!Array.isArray(row.image_urls)) row.image_urls = [];
    } catch (_) { row.image_urls = []; }
  } else {
    row.image_urls = row.image_url ? [row.image_url] : [];
  }
  return row;
}

// Публичный список гостиниц
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, location, price, phone, address, description, image_url, image_urls, created_at FROM hotels ORDER BY name'
    );
    rows.forEach(parseImageUrls);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки списка' });
  }
});

// Публичная карточка одной гостиницы (с удобствами)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, location, price, phone, address, description, image_url, image_urls, created_at FROM hotels WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Не найдено' });
    const hotel = parseImageUrls(rows[0]);
    hotel.amenities = await getHotelAmenities(req.params.id);
    res.json(hotel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

// --- Создание: админ или хозяин (хозяин — только со своим owner_id) ---
router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const { name, location, price, phone, address, map_link, latitude, longitude, description, image_url, image_urls, amenities } = body;
    const rooms = Array.isArray(body.rooms) ? body.rooms : [];
    if (!name || !name.trim()) return res.status(400).json({ error: 'Название обязательно' });
    const urls = Array.isArray(image_urls) ? image_urls.filter(Boolean).slice(0, 10) : (image_url ? [image_url] : []);
    const firstUrl = urls[0] || null;
    const ownerId = isOwner(req) ? req.session.admin.id : null;
    const mapLink = map_link && String(map_link).trim() ? String(map_link).trim() : null;
    const lat = latitude != null && latitude !== '' ? Number(latitude) : null;
    const lng = longitude != null && longitude !== '' ? Number(longitude) : null;
    const i18nJson = normalizeI18nFromBody(body);
    const [r] = await pool.query(
      `INSERT INTO hotels (name, location, price, phone, address, map_link, latitude, longitude, description, image_url, image_urls, owner_id, i18n)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), location?.trim() || null, price?.trim() || null, phone?.trim() || null, address?.trim() || null, mapLink, isNaN(lat) ? null : lat, isNaN(lng) ? null : lng, description?.trim() || null, firstUrl, JSON.stringify(urls), ownerId, i18nJson]
    );
    const hotelId = r.insertId;
    const slug = hotelSlug(name.trim(), hotelId);
    await pool.query('UPDATE hotels SET slug = ? WHERE id = ?', [slug, hotelId]);
    await setHotelAmenities(hotelId, Array.isArray(amenities) ? amenities : []);
    await setHotelRooms(hotelId, rooms);
    res.status(201).json({ id: hotelId, slug, message: 'Создано' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания' });
  }
});

// --- Редактирование/удаление: админ — любая гостиница, хозяин — только своя ---
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const allowed = await canEditHotel(req, req.params.id);
    if (!allowed) return res.status(403).json({ error: 'Нет доступа к этой гостинице' });
    const body = req.body || {};
    const { name, location, price, phone, address, map_link, latitude, longitude, description, image_url, image_urls, amenities } = body;
    const rooms = Array.isArray(body.rooms) ? body.rooms : [];
    if (!name || !name.trim()) return res.status(400).json({ error: 'Название обязательно' });
    const urls = Array.isArray(image_urls) ? image_urls.filter(Boolean).slice(0, 10) : (image_url ? [image_url] : []);
    const firstUrl = urls[0] || null;
    const mapLink = map_link && String(map_link).trim() ? String(map_link).trim() : null;
    const lat = latitude != null && latitude !== '' ? Number(latitude) : null;
    const lng = longitude != null && longitude !== '' ? Number(longitude) : null;
    const slug = hotelSlug(name.trim(), req.params.id);
    const i18nJson = normalizeI18nFromBody(body);
    const [r] = await pool.query(
      `UPDATE hotels SET name=?, location=?, price=?, phone=?, address=?, map_link=?, latitude=?, longitude=?, description=?, image_url=?, image_urls=?, slug=?, i18n=? WHERE id=?`,
      [name.trim(), location?.trim() || null, price?.trim() || null, phone?.trim() || null, address?.trim() || null, mapLink, isNaN(lat) ? null : lat, isNaN(lng) ? null : lng, description?.trim() || null, firstUrl, JSON.stringify(urls), slug, i18nJson, req.params.id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Не найдено' });
    await setHotelAmenities(req.params.id, Array.isArray(amenities) ? amenities : []);
    await setHotelRooms(req.params.id, rooms);
    res.json({ message: 'Обновлено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const allowed = await canEditHotel(req, req.params.id);
    if (!allowed) return res.status(403).json({ error: 'Нет доступа к этой гостинице' });
    const [r] = await pool.query('DELETE FROM hotels WHERE id = ?', [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Не найдено' });
    res.json({ message: 'Удалено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

module.exports = router;
