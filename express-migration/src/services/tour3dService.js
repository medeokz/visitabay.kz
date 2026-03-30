const pool = require("../db/pool");
const { db } = require("../config/env");

function table() {
  return `\`${db.prefix}_tour3d\``;
}

function normalizeMatterportUrl(raw) {
  let s = String(raw || "").trim();
  if (!s) return "";
  if (/^http:\/\/my\.matterport\.com/i.test(s)) s = `https${s.slice(4)}`;
  return s;
}

function isMatterportUrl(s) {
  return /^https:\/\/my\.matterport\.com\//i.test(String(s || "").trim());
}

/** Matterport или Treedis (iframe), только https */
function isTourEmbedUrl(s) {
  const u = String(s || "").trim();
  if (!/^https:\/\//i.test(u)) return false;
  if (/^https:\/\/my\.matterport\.com\//i.test(u)) return true;
  if (/^https:\/\/my\.treedis\.com\/tour\//i.test(u)) return true;
  return false;
}

function posterPublicUrl(path) {
  const p = String(path || "").trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  if (/^\/uploads\//i.test(p)) return p;
  return `/uploads/${p.replace(/^\/+/, "")}`;
}

async function ensureTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS ${table()} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      matterport_url VARCHAR(2048) NOT NULL,
      poster VARCHAR(512) NULL,
      short_story TEXT NULL,
      full_story TEXT NULL,
      legacy_html VARCHAR(255) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_published TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  await pool.query(sql);
  await pool.query(`ALTER TABLE ${table()} ADD COLUMN full_story TEXT NULL`).catch(() => {});
  await pool.query(`ALTER TABLE ${table()} ADD COLUMN legacy_html VARCHAR(255) NULL`).catch(() => {});
}

function normalizeLegacyHtml(raw) {
  let s = String(raw || "").trim().toLowerCase();
  if (!s) return "";
  if (!s.endsWith(".html")) s = `${s}.html`;
  return s.replace(/\s+/g, "");
}

function mapRowForSite(row) {
  if (!row) return null;
  const matterport_url = normalizeMatterportUrl(row.matterport_url);
  const legacy_html = String(row.legacy_html || "").trim().toLowerCase();
  return {
    id: row.id,
    title: row.title,
    matterport_url,
    matterport_ok: isTourEmbedUrl(matterport_url),
    poster: posterPublicUrl(row.poster),
    short_story: row.short_story || "",
    full_story: row.full_story || "",
    legacy_html,
    sort_order: row.sort_order
  };
}

async function listPublishedForSite() {
  const sql = `
    SELECT id, title, matterport_url, poster, short_story, full_story, legacy_html, sort_order
    FROM ${table()}
    WHERE is_published = 1
    ORDER BY sort_order ASC, id DESC
  `;
  const [rows] = await pool.query(sql);
  return (rows || []).map(mapRowForSite).filter((t) => t.matterport_ok);
}

async function listAllAdmin() {
  const sql = `
    SELECT id, title, matterport_url, poster, short_story, full_story, legacy_html, sort_order, is_published, created_at, updated_at
    FROM ${table()}
    ORDER BY sort_order ASC, id DESC
  `;
  const [rows] = await pool.query(sql);
  return rows || [];
}

async function getById(id) {
  const sql = `SELECT * FROM ${table()} WHERE id = ? LIMIT 1`;
  const [rows] = await pool.query(sql, [id]);
  return rows[0] || null;
}

function bodyFromRequest(body) {
  const title = String(body.title || "").trim();
  const matterport_url = normalizeMatterportUrl(body.matterport_url || "");
  const poster = String(body.poster || "").trim();
  const short_story = String(body.short_story || "");
  const full_story = String(body.full_story || "");
  const legacy_html = normalizeLegacyHtml(body.legacy_html || "");
  const sort_order = Number(body.sort_order) || 0;
  const is_published = body.is_published === "1" || body.is_published === "on" ? 1 : 0;
  return { title, matterport_url, poster, short_story, full_story, legacy_html, sort_order, is_published };
}

async function create(payload) {
  const b = typeof payload === "object" && payload ? payload : {};
  const sql = `
    INSERT INTO ${table()} (title, matterport_url, poster, short_story, full_story, legacy_html, sort_order, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [r] = await pool.query(sql, [
    b.title,
    b.matterport_url,
    b.poster || null,
    b.short_story || null,
    b.full_story || null,
    b.legacy_html || null,
    b.sort_order,
    b.is_published
  ]);
  return r.insertId;
}

async function update(id, payload) {
  const b = typeof payload === "object" && payload ? payload : {};
  const sql = `
    UPDATE ${table()}
    SET title = ?, matterport_url = ?, poster = ?, short_story = ?, full_story = ?, legacy_html = ?, sort_order = ?, is_published = ?
    WHERE id = ?
    LIMIT 1
  `;
  await pool.query(sql, [
    b.title,
    b.matterport_url,
    b.poster || null,
    b.short_story || null,
    b.full_story || null,
    b.legacy_html || null,
    b.sort_order,
    b.is_published,
    id
  ]);
}

async function remove(id) {
  await pool.query(`DELETE FROM ${table()} WHERE id = ? LIMIT 1`, [id]);
}

async function getPublishedByLegacyHtml(fileName) {
  const want = normalizeLegacyHtml(fileName);
  if (!want || !want.endsWith(".html")) return null;
  const sql = `
    SELECT id, title, matterport_url, poster, short_story, full_story, legacy_html, sort_order, updated_at
    FROM ${table()}
    WHERE is_published = 1 AND LOWER(legacy_html) = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [want]);
  const row = rows[0];
  return row ? mapRowForSite(row) : null;
}

async function isLegacyHtmlTaken(legacyHtml, excludeId = 0) {
  const want = normalizeLegacyHtml(legacyHtml);
  if (!want) return false;
  const sql =
    excludeId > 0
      ? `SELECT id FROM ${table()} WHERE LOWER(legacy_html) = ? AND id <> ? LIMIT 1`
      : `SELECT id FROM ${table()} WHERE LOWER(legacy_html) = ? LIMIT 1`;
  const params = excludeId > 0 ? [want, excludeId] : [want];
  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
}

async function listLegacySitemapRows() {
  const sql = `
    SELECT legacy_html, updated_at FROM ${table()}
    WHERE is_published = 1 AND legacy_html IS NOT NULL AND TRIM(legacy_html) <> ''
  `;
  const [rows] = await pool.query(sql);
  return rows || [];
}

module.exports = {
  ensureTable,
  normalizeMatterportUrl,
  normalizeLegacyHtml,
  isMatterportUrl,
  isTourEmbedUrl,
  posterPublicUrl,
  listPublishedForSite,
  listAllAdmin,
  getById,
  bodyFromRequest,
  create,
  update,
  remove,
  getPublishedByLegacyHtml,
  listLegacySitemapRows,
  isLegacyHtmlTaken
};
