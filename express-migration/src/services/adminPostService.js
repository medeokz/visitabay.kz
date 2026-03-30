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

async function getCategories() {
  const sql = `SELECT id, name, alt_name FROM ${table("category")} WHERE active = 1 ORDER BY name ASC`;
  const [rows] = await pool.query(sql);
  return rows;
}

async function listPosts(opts = {}) {
  // Backward compat: listPosts(300)
  const options = typeof opts === "number" ? { limit: opts } : opts || {};
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 200;
  const q = String(options.q || "").trim();
  const categoryId = Number(options.categoryId) || 0;

  const wheres = [];
  const params = [];

  if (q) {
    wheres.push("title LIKE ?");
    params.push(`%${q}%`);
  }
  if (categoryId > 0) {
    wheres.push("FIND_IN_SET(?, category)");
    params.push(String(categoryId));
  }

  const whereSql = wheres.length ? `WHERE ${wheres.join(" AND ")}` : "";

  const sql = `
    SELECT id, title, alt_name, date, category, approve
    FROM ${table("post")}
    ${whereSql}
    ORDER BY id DESC
    LIMIT ?
  `;
  params.push(limit);

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getPostById(id) {
  const sql = `
    SELECT id, title, alt_name, short_story, full_story, xfields, category, tags, metatitle, descr, keywords, approve, allow_main
    FROM ${table("post")}
    WHERE id = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [id]);
  return rows[0] || null;
}

async function ensureUniqueSlug(initial, excludeId = null) {
  let base = slugify(initial) || `post-${Date.now()}`;
  let candidate = base;
  let n = 1;
  while (true) {
    const sql = excludeId
      ? `SELECT id FROM ${table("post")} WHERE alt_name = ? AND id <> ? LIMIT 1`
      : `SELECT id FROM ${table("post")} WHERE alt_name = ? LIMIT 1`;
    const params = excludeId ? [candidate, excludeId] : [candidate];
    const [rows] = await pool.query(sql, params);
    if (!rows.length) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

async function createPost(payload) {
  const slug = await ensureUniqueSlug(payload.alt_name || payload.title);
  const sql = `
    INSERT INTO ${table("post")}
      (autor, date, short_story, full_story, xfields, title, descr, keywords, category, alt_name, comm_num, allow_comm, allow_main, approve, fixed, allow_br, symbol, tags, metatitle)
    VALUES
      (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, 0, 1, '', ?, ?)
  `;
  const params = [
    payload.autor || "admin",
    payload.short_story || "",
    payload.full_story || "",
    payload.xfields || "",
    payload.title || "",
    payload.descr || payload.title || "",
    payload.keywords || "",
    payload.category || "0",
    slug,
    payload.allow_main ? 1 : 0,
    payload.approve ? 1 : 0,
    payload.tags || "",
    payload.metatitle || payload.title || ""
  ];
  const [result] = await pool.query(sql, params);
  return result.insertId;
}

async function updatePost(id, payload) {
  const slug = await ensureUniqueSlug(payload.alt_name || payload.title, id);
  const sql = `
    UPDATE ${table("post")}
    SET
      title = ?,
      alt_name = ?,
      short_story = ?,
      full_story = ?,
      xfields = ?,
      category = ?,
      tags = ?,
      metatitle = ?,
      descr = ?,
      keywords = ?,
      approve = ?,
      allow_main = ?
    WHERE id = ?
    LIMIT 1
  `;
  const params = [
    payload.title || "",
    slug,
    payload.short_story || "",
    payload.full_story || "",
    payload.xfields || "",
    payload.category || "0",
    payload.tags || "",
    payload.metatitle || payload.title || "",
    payload.descr || payload.title || "",
    payload.keywords || "",
    payload.approve ? 1 : 0,
    payload.allow_main ? 1 : 0,
    id
  ];
  await pool.query(sql, params);
}

async function deletePost(id) {
  const sql = `DELETE FROM ${table("post")} WHERE id = ? LIMIT 1`;
  await pool.query(sql, [id]);
}

module.exports = {
  getCategories,
  listPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
};
