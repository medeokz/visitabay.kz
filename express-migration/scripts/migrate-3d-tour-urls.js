/**
 * Устарело: 3D-туры вынесены в таблицу abay_tour3d и админку /admin/tours-3d.
 * Скрипт по-прежнему может заполнять tour3d_html в постах для совместимости со старым DLE.
 *
 * Импорт Matterport из постов: npm run import:3d-from-posts
 *
 * Запуск: node scripts/migrate-3d-tour-urls.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const pool = require("../src/db/pool");
const { db } = require("../src/config/env");
const { CATEGORY_3D_SLUG } = require("../src/config/contentSections");

function table(name) {
  return `\`${db.prefix}_${name}\``;
}

function decodeLegacyPipes(str) {
  return String(str || "").replace(/&#124;/g, "|");
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

function encodeXfieldsValue(value) {
  return String(value || "").replace(/\|/g, "&#124;");
}

function serializeXfields(fields) {
  return Object.entries(fields)
    .filter(([, value]) => String(value || "").trim() !== "")
    .map(([key, value]) => `${key}|${encodeXfieldsValue(value)}`)
    .join("||");
}

function dleHtmlName(id, altName) {
  const slug = String(altName || "").trim();
  if (!slug) return "";
  return `${id}-${slug}.html`;
}

async function run() {
  const [catRows] = await pool.query(
    `SELECT id FROM ${table("category")} WHERE alt_name = ? AND active = 1 LIMIT 1`,
    [CATEGORY_3D_SLUG]
  );
  const cat = catRows[0];
  if (!cat) {
    // eslint-disable-next-line no-console
    console.error(`Категория с alt_name="${CATEGORY_3D_SLUG}" не найдена.`);
    process.exit(1);
  }
  const catId = String(cat.id);

  const [posts] = await pool.query(
    `SELECT id, alt_name, xfields FROM ${table("post")} WHERE FIND_IN_SET(?, category)`,
    [catId]
  );

  let updated = 0;
  let skipped = 0;

  for (const p of posts) {
    const html = dleHtmlName(p.id, p.alt_name);
    if (!html) {
      // eslint-disable-next-line no-console
      console.warn(`Пропуск id=${p.id}: пустой alt_name`);
      skipped += 1;
      continue;
    }

    const parsed = parseXfields(p.xfields || "");
    parsed.tour3d_html = html;
    const nextX = serializeXfields(parsed);

    await pool.query(`UPDATE ${table("post")} SET xfields = ? WHERE id = ? LIMIT 1`, [nextX, p.id]);
    updated += 1;
    // eslint-disable-next-line no-console
    console.log(`OK id=${p.id} alt=${p.alt_name} → /3d/${html}`);
  }

  // eslint-disable-next-line no-console
  console.log(`\nГотово: обновлено ${updated}, пропущено ${skipped}.`);
  await pool.end();
}

run().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  try {
    await pool.end();
  } catch (_) {}
  process.exit(1);
});
