const pool = require("../db/pool");
const { PRIMARY_LOCALE } = require("../../../hotels/utils/i18n");

const TABLE = "events_semey";

async function ensureTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS \`${TABLE}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      summary TEXT NULL,
      description MEDIUMTEXT NULL,
      event_date DATE NULL,
      event_time VARCHAR(50) NULL,
      location VARCHAR(255) NULL,
      address VARCHAR(255) NULL,
      price VARCHAR(120) NULL,
      poster_url VARCHAR(500) NULL,
      route_link VARCHAR(700) NULL,
      ticket_url VARCHAR(500) NULL,
      is_published TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      i18n JSON DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  await pool.query(sql);
  await pool.query(`ALTER TABLE \`${TABLE}\` ADD COLUMN route_link VARCHAR(700) NULL`).catch(() => {});
  await pool.query(`ALTER TABLE \`${TABLE}\` ADD COLUMN i18n JSON DEFAULT NULL`).catch(() => {});
}

function slugify(value) {
  const map = {
    а: "a", ә: "a", б: "b", в: "v", г: "g", ғ: "g", д: "d", е: "e", ё: "e", ж: "zh",
    з: "z", и: "i", й: "i", к: "k", қ: "k", л: "l", м: "m", н: "n", ң: "n", о: "o",
    ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ұ: "u", ү: "u", ф: "f", х: "h",
    һ: "h", ц: "c", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", і: "i", ь: "", э: "e",
    ю: "yu", я: "ya"
  };
  const translit = String(value || "")
    .toLowerCase()
    .split("")
    .map((ch) => (Object.prototype.hasOwnProperty.call(map, ch) ? map[ch] : ch))
    .join("");
  return translit
    .trim()
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base, excludeId = 0) {
  let candidate = slugify(base) || `event-${Date.now()}`;
  let n = 1;
  while (true) {
    const sql = excludeId
      ? `SELECT id FROM \`${TABLE}\` WHERE slug = ? AND id <> ? LIMIT 1`
      : `SELECT id FROM \`${TABLE}\` WHERE slug = ? LIMIT 1`;
    const params = excludeId ? [candidate, excludeId] : [candidate];
    const [rows] = await pool.query(sql, params);
    if (!rows.length) return candidate;
    n += 1;
    candidate = `${slugify(base) || "event"}-${n}`;
  }
}

function parseI18n(val) {
  if (val == null || val === "") return null;
  if (typeof val === "object" && !Buffer.isBuffer(val)) return val;
  const s = Buffer.isBuffer(val) ? val.toString("utf8") : String(val);
  if (!s.trim()) return null;
  try {
    const o = JSON.parse(s);
    return o && typeof o === "object" ? o : null;
  } catch {
    return null;
  }
}

/** Доп. языки в БД: только ru / en (основной текст — бағандарда, қазақша). */
function eventI18nPayload(body) {
  function trimFields(o) {
    const out = {};
    Object.keys(o).forEach((k) => {
      const v = o[k];
      if (v != null && String(v).trim()) out[k] = String(v).trim();
    });
    return out;
  }
  const ru = trimFields({
    title: body.title_ru,
    summary: body.summary_ru,
    description: body.description_ru,
    location: body.location_ru,
    address: body.address_ru,
    price: body.price_ru
  });
  const en = trimFields({
    title: body.title_en,
    summary: body.summary_en,
    description: body.description_en,
    location: body.location_en,
    address: body.address_en,
    price: body.price_en
  });
  const i18n = {};
  if (Object.keys(ru).length) i18n.ru = ru;
  if (Object.keys(en).length) i18n.en = en;
  return Object.keys(i18n).length ? JSON.stringify(i18n) : null;
}

function mergeEventOverlay(row, overlay) {
  if (!overlay || typeof overlay !== "object") return row;
  const next = { ...row };
  const keys = ["title", "summary", "description", "location", "address", "price"];
  keys.forEach((key) => {
    if (overlay[key] != null && String(overlay[key]).trim() !== "") next[key] = String(overlay[key]).trim();
  });
  return next;
}

function applyEventLocale(row, locale) {
  if (!row) return row;
  const loc = locale || PRIMARY_LOCALE;
  const bag = parseI18n(row.i18n);
  if (loc === PRIMARY_LOCALE) {
    if (bag && bag[PRIMARY_LOCALE] && typeof bag[PRIMARY_LOCALE] === "object" && Object.keys(bag[PRIMARY_LOCALE]).length) {
      return mergeEventOverlay(row, bag[PRIMARY_LOCALE]);
    }
    return row;
  }
  if (bag && bag[loc] && typeof bag[loc] === "object") return mergeEventOverlay(row, bag[loc]);
  return row;
}

function mapPayload(body) {
  return {
    title: String(body.title || "").trim(),
    slug: String(body.slug || "").trim(),
    summary: String(body.summary || "").trim(),
    description: String(body.description || "").trim(),
    event_date: body.event_date ? String(body.event_date).trim() : null,
    event_time: String(body.event_time || "").trim(),
    location: String(body.location || "").trim(),
    address: String(body.address || "").trim(),
    price: String(body.price || "").trim(),
    poster_url: String(body.poster_url || "").trim(),
    route_link: String(body.route_link || "").trim(),
    ticket_url: String(body.ticket_url || "").trim(),
    is_published: body.is_published === "1" || body.is_published === "on" ? 1 : 0,
    sort_order: Number(body.sort_order) || 0,
    i18n: eventI18nPayload(body || {})
  };
}

function normalizePosterUrl(value) {
  const src = String(value || "").trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/uploads/")) return src;
  return `/uploads/${src.replace(/^\/+/, "")}`;
}

function normalizeEventRow(row) {
  if (!row) return row;
  return {
    ...row,
    poster_url: normalizePosterUrl(row.poster_url)
  };
}

async function listPublic(limit = 200) {
  const sql = `
    SELECT id, title, slug, summary, description, event_date, event_time, location, address, price, poster_url, route_link, ticket_url, sort_order, i18n
    FROM \`${TABLE}\`
    WHERE is_published = 1
    ORDER BY (event_date IS NULL) ASC, event_date ASC, sort_order ASC, id DESC
    LIMIT ?
  `;
  const [rows] = await pool.query(sql, [Number(limit) || 200]);
  return rows.map(normalizeEventRow);
}

async function listAdmin({ q = "", limit = 500 } = {}) {
  const where = [];
  const params = [];
  const needle = String(q || "").trim();
  if (needle) {
    where.push("title LIKE ?");
    params.push(`%${needle}%`);
  }
  const sql = `
    SELECT id, title, slug, event_date, event_time, location, price, route_link, is_published, sort_order, updated_at
    FROM \`${TABLE}\`
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY (event_date IS NULL) ASC, event_date ASC, sort_order ASC, id DESC
    LIMIT ?
  `;
  params.push(Number(limit) || 500);
  const [rows] = await pool.query(sql, params);
  return rows.map(normalizeEventRow);
}

async function getById(id) {
  const [rows] = await pool.query(`SELECT * FROM \`${TABLE}\` WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? normalizeEventRow(rows[0]) : null;
}

async function getBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT * FROM \`${TABLE}\` WHERE slug = ? AND is_published = 1 LIMIT 1`,
    [String(slug || "").trim()]
  );
  return rows[0] ? normalizeEventRow(rows[0]) : null;
}

async function createFromBody(body) {
  const payload = mapPayload(body);
  if (!payload.title) throw new Error("TITLE_REQUIRED");
  payload.slug = await uniqueSlug(payload.slug || payload.title);
  const sql = `
    INSERT INTO \`${TABLE}\`
      (title, slug, summary, description, event_date, event_time, location, address, price, poster_url, route_link, ticket_url, is_published, sort_order, i18n)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    payload.title,
    payload.slug,
    payload.summary || null,
    payload.description || null,
    payload.event_date || null,
    payload.event_time || null,
    payload.location || null,
    payload.address || null,
    payload.price || null,
    payload.poster_url || null,
    payload.route_link || null,
    payload.ticket_url || null,
    payload.is_published,
    payload.sort_order,
    payload.i18n
  ];
  const [result] = await pool.query(sql, params);
  return result.insertId;
}

async function updateFromBody(id, body) {
  const payload = mapPayload(body);
  if (!payload.title) {
    const current = await getById(id);
    payload.title = String((current && current.title) || "").trim();
  }
  if (!payload.title) throw new Error("TITLE_REQUIRED");
  payload.slug = await uniqueSlug(payload.slug || payload.title, id);
  const sql = `
    UPDATE \`${TABLE}\`
    SET title = ?, slug = ?, summary = ?, description = ?, event_date = ?, event_time = ?,
        location = ?, address = ?, price = ?, poster_url = ?, route_link = ?, ticket_url = ?, is_published = ?, sort_order = ?, i18n = ?
    WHERE id = ?
  `;
  const params = [
    payload.title,
    payload.slug,
    payload.summary || null,
    payload.description || null,
    payload.event_date || null,
    payload.event_time || null,
    payload.location || null,
    payload.address || null,
    payload.price || null,
    payload.poster_url || null,
    payload.route_link || null,
    payload.ticket_url || null,
    payload.is_published,
    payload.sort_order,
    payload.i18n,
    id
  ];
  await pool.query(sql, params);
}

async function remove(id) {
  await pool.query(`DELETE FROM \`${TABLE}\` WHERE id = ?`, [id]);
}

module.exports = {
  ensureTable,
  listPublic,
  listAdmin,
  getById,
  getBySlug,
  createFromBody,
  updateFromBody,
  remove,
  applyEventLocale
};
