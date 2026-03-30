const pool = require("../db/pool");
const { db } = require("../config/env");

function table(name) {
  return `\`${db.prefix}_${name}\``;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яёіїңғүұқөһ\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function listCategories() {
  const sql = `
    SELECT id, parentid, name, alt_name, active, posi
    FROM ${table("category")}
    ORDER BY posi ASC, id ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

async function getCategoryById(id) {
  const sql = `
    SELECT id, parentid, posi, name, alt_name, descr, fulldescr, metatitle, keywords, active, i18n
    FROM ${table("category")}
    WHERE id = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [id]);
  return rows[0] || null;
}

async function ensureUniqueSlug(initial, excludeId = null) {
  const base = slugify(initial) || `category-${Date.now()}`;
  let candidate = base;
  let i = 1;
  while (true) {
    const sql = excludeId
      ? `SELECT id FROM ${table("category")} WHERE alt_name = ? AND id <> ? LIMIT 1`
      : `SELECT id FROM ${table("category")} WHERE alt_name = ? LIMIT 1`;
    const params = excludeId ? [candidate, excludeId] : [candidate];
    const [rows] = await pool.query(sql, params);
    if (!rows.length) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
  }
}

async function createCategory(payload) {
  const slug = await ensureUniqueSlug(payload.alt_name || payload.name);
  const sql = `
    INSERT INTO ${table("category")}
      (parentid, posi, name, alt_name, icon, skin, descr, keywords, news_sort, news_msort, news_number, short_tpl, full_tpl, metatitle, show_sub, allow_rss, fulldescr, disable_search, disable_main, disable_rating, disable_comments, enable_dzen, active, rating_type, schema_org, disable_index, i18n)
    VALUES
      (?, ?, ?, ?, '', '', ?, ?, 'date', 'DESC', 10, '', '', ?, 0, 1, ?, 0, 0, 0, 0, 1, ?, -1, '1', 0, ?)
  `;
  const [result] = await pool.query(sql, [
    payload.parentid || 0,
    payload.posi || 1,
    payload.name || "",
    slug,
    payload.descr || "",
    payload.keywords || "",
    payload.metatitle || payload.name || "",
    payload.fulldescr || "",
    payload.active ? 1 : 0,
    payload.i18n || null
  ]);
  return result.insertId;
}

async function updateCategory(id, payload) {
  const slug = await ensureUniqueSlug(payload.alt_name || payload.name, id);
  const sql = `
    UPDATE ${table("category")}
    SET
      parentid = ?,
      posi = ?,
      name = ?,
      alt_name = ?,
      descr = ?,
      keywords = ?,
      metatitle = ?,
      fulldescr = ?,
      active = ?,
      i18n = ?
    WHERE id = ?
    LIMIT 1
  `;
  await pool.query(sql, [
    payload.parentid || 0,
    payload.posi || 1,
    payload.name || "",
    slug,
    payload.descr || "",
    payload.keywords || "",
    payload.metatitle || payload.name || "",
    payload.fulldescr || "",
    payload.active ? 1 : 0,
    payload.i18n || null,
    id
  ]);
}

async function deleteCategory(id) {
  const sql = `DELETE FROM ${table("category")} WHERE id = ? LIMIT 1`;
  await pool.query(sql, [id]);
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
