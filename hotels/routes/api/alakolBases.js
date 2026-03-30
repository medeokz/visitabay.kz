const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const { hotelSlug } = require("../../utils/slug");
const { normalizeI18nFromBody } = require("../../utils/i18n");
const { requireAdmin } = require("../../middleware/auth");

function parseImageUrls(row) {
  if (!row) return row;
  if (row.image_urls != null) {
    try {
      row.image_urls =
        typeof row.image_urls === "string" ? JSON.parse(row.image_urls) : row.image_urls;
      if (!Array.isArray(row.image_urls)) row.image_urls = [];
    } catch (_) {
      row.image_urls = [];
    }
  } else {
    row.image_urls = row.image_url ? [row.image_url] : [];
  }
  return row;
}

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, location, price, phone, address, description, image_url, image_urls,
              latitude, longitude, map_link, created_at
       FROM alakol_bases WHERE is_published = 1 ORDER BY sort_order ASC, name`
    );
    rows.forEach(parseImageUrls);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка загрузки списка" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM alakol_bases WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Не найдено" });
    res.json(parseImageUrls(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка загрузки" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const {
      name,
      location,
      price,
      phone,
      address,
      map_link,
      latitude,
      longitude,
      description,
      image_url,
      image_urls,
      sort_order,
      is_published
    } = body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Название обязательно" });
    const urls = Array.isArray(image_urls)
      ? image_urls.filter(Boolean).slice(0, 10)
      : image_url
        ? [image_url]
        : [];
    const firstUrl = urls[0] || null;
    const mapLink = map_link && String(map_link).trim() ? String(map_link).trim() : null;
    const lat = latitude != null && latitude !== "" ? Number(latitude) : null;
    const lng = longitude != null && longitude !== "" ? Number(longitude) : null;
    const sort =
      sort_order != null && sort_order !== "" ? parseInt(String(sort_order), 10) : 0;
    const pub =
      is_published === undefined || is_published === null || is_published === ""
        ? 1
        : parseInt(String(is_published), 10)
          ? 1
          : 0;
    const i18nJson = normalizeI18nFromBody(body);
    const [r] = await pool.query(
      `INSERT INTO alakol_bases (name, location, price, phone, address, map_link, latitude, longitude,
        description, image_url, image_urls, sort_order, is_published, i18n)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        location?.trim() || null,
        price?.trim() || null,
        phone?.trim() || null,
        address?.trim() || null,
        mapLink,
        isNaN(lat) ? null : lat,
        isNaN(lng) ? null : lng,
        description?.trim() || null,
        firstUrl,
        JSON.stringify(urls),
        Number.isFinite(sort) ? sort : 0,
        pub,
        i18nJson
      ]
    );
    const id = r.insertId;
    const slug = hotelSlug(name.trim(), id);
    await pool.query("UPDATE alakol_bases SET slug = ? WHERE id = ?", [slug, id]);
    res.status(201).json({ id, slug, message: "Создано" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка создания" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const {
      name,
      location,
      price,
      phone,
      address,
      map_link,
      latitude,
      longitude,
      description,
      image_url,
      image_urls,
      sort_order,
      is_published
    } = body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Название обязательно" });
    const urls = Array.isArray(image_urls)
      ? image_urls.filter(Boolean).slice(0, 10)
      : image_url
        ? [image_url]
        : [];
    const firstUrl = urls[0] || null;
    const mapLink = map_link && String(map_link).trim() ? String(map_link).trim() : null;
    const lat = latitude != null && latitude !== "" ? Number(latitude) : null;
    const lng = longitude != null && longitude !== "" ? Number(longitude) : null;
    const sort =
      sort_order != null && sort_order !== "" ? parseInt(String(sort_order), 10) : 0;
    const pub =
      is_published === undefined || is_published === null || is_published === ""
        ? 1
        : parseInt(String(is_published), 10)
          ? 1
          : 0;
    const slug = hotelSlug(name.trim(), req.params.id);
    const i18nJson = normalizeI18nFromBody(body);
    const [r] = await pool.query(
      `UPDATE alakol_bases SET name=?, location=?, price=?, phone=?, address=?, map_link=?, latitude=?,
        longitude=?, description=?, image_url=?, image_urls=?, slug=?, sort_order=?, is_published=?, i18n=? WHERE id=?`,
      [
        name.trim(),
        location?.trim() || null,
        price?.trim() || null,
        phone?.trim() || null,
        address?.trim() || null,
        mapLink,
        isNaN(lat) ? null : lat,
        isNaN(lng) ? null : lng,
        description?.trim() || null,
        firstUrl,
        JSON.stringify(urls),
        slug,
        Number.isFinite(sort) ? sort : 0,
        pub,
        i18nJson,
        req.params.id
      ]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: "Не найдено" });
    res.json({ message: "Обновлено" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка обновления" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const [r] = await pool.query("DELETE FROM alakol_bases WHERE id = ?", [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: "Не найдено" });
    res.json({ message: "Удалено" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка удаления" });
  }
});

module.exports = router;
