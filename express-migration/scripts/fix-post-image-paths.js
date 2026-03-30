const fs = require("fs");
const path = require("path");
const pool = require("../src/db/pool");
const { db } = require("../src/config/env");

function table(name) {
  return `\`${db.prefix}_${name}\``;
}

function decodeLegacyPipes(str) {
  return String(str || "").replace(/&#124;/g, "|");
}

function encodeLegacyPipes(str) {
  return String(str || "").replace(/\|/g, "&#124;");
}

function parseXfields(raw) {
  const out = {};
  const src = decodeLegacyPipes(raw);
  if (!src) return out;
  const chunks = src.split("||").filter(Boolean);
  for (const chunk of chunks) {
    const idx = chunk.indexOf("|");
    if (idx < 1) continue;
    const key = chunk.slice(0, idx).trim();
    const val = chunk.slice(idx + 1);
    out[key] = val;
  }
  return out;
}

function serializeXfields(fields) {
  return Object.entries(fields)
    .map(([k, v]) => `${k}|${encodeLegacyPipes(v)}`)
    .join("||");
}

function normalizeImagePart(part, uploadsPostsRoot) {
  const bits = String(part || "").split("|");
  const img = (bits[0] || "").trim();
  if (!img) return part;
  if (/^https?:\/\//i.test(img) || /^\/uploads\//i.test(img) || /^posts\//i.test(img)) return part;
  const candidate = path.join(uploadsPostsRoot, img.replace(/\//g, path.sep));
  if (fs.existsSync(candidate)) {
    bits[0] = `posts/${img.replace(/^\/+/, "")}`;
    return bits.join("|");
  }
  return part;
}

function normalizeContentUploads(text, uploadsPostsRoot) {
  return String(text || "").replace(/\/uploads\/((?:20\d{2}-\d{2})\/[^"'()\s<>]+)/gi, (m, rel) => {
    const candidate = path.join(uploadsPostsRoot, rel.replace(/\//g, path.sep));
    if (fs.existsSync(candidate)) return `/uploads/posts/${rel}`;
    return m;
  });
}

async function run() {
  const uploadsPostsRoot = path.resolve(__dirname, "..", "..", "uploads", "posts");
  const sql = `SELECT id, xfields, short_story, full_story FROM ${table("post")}`;
  const [rows] = await pool.query(sql);

  let changed = 0;
  for (const row of rows) {
    const x = parseXfields(row.xfields || "");
    const beforeX = row.xfields || "";
    const beforeShort = row.short_story || "";
    const beforeFull = row.full_story || "";

    if (x.poster) {
      x.poster = normalizeImagePart(x.poster, uploadsPostsRoot);
    }
    if (x.gallery) {
      x.gallery = String(x.gallery)
        .split(",")
        .map((p) => normalizeImagePart(p, uploadsPostsRoot))
        .join(",");
    }

    const nextX = serializeXfields(x);
    const nextShort = normalizeContentUploads(beforeShort, uploadsPostsRoot);
    const nextFull = normalizeContentUploads(beforeFull, uploadsPostsRoot);

    if (nextX !== beforeX || nextShort !== beforeShort || nextFull !== beforeFull) {
      await pool.query(
        `UPDATE ${table("post")} SET xfields = ?, short_story = ?, full_story = ? WHERE id = ? LIMIT 1`,
        [nextX, nextShort, nextFull, row.id]
      );
      changed += 1;
    }
  }

  console.log(`Updated posts: ${changed}`);
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await pool.end();
    } catch (_) {}
  });
