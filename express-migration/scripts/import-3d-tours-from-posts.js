/**
 * Копирует посты из категории DLE (по умолчанию id=23) в abay_tour3d для /admin/3d.
 * Embed: xfields tour3d_public_url, iframe, mapfull или ссылка в full_story/short_story (Matterport / Treedis).
 * legacy_html: xfields tour3d_html или {id}-{alt_name}.html
 *
 * Запуск:
 *   npm run import:3d-from-posts
 *   node scripts/import-3d-tours-from-posts.js 23
 *
 * Переменная: POSTS_3D_CATEGORY_ID=23
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const pool = require("../src/db/pool");
const { db } = require("../src/config/env");
const tour3dService = require("../src/services/tour3dService");

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
  for (const chunk of src.split("||").filter(Boolean)) {
    const idx = chunk.indexOf("|");
    if (idx < 1) continue;
    out[chunk.slice(0, idx).trim()] = chunk.slice(idx + 1);
  }
  return out;
}

function extractMatterportFromHtml(html) {
  const m = String(html || "").match(/https?:\/\/my\.matterport\.com\/[^\s"'<>]+/i);
  if (!m) return "";
  return m[0].replace(/[<)'"]+$/, "").trim();
}

function extractTreedisFromHtml(html) {
  const m = String(html || "").match(/https?:\/\/my\.treedis\.com\/tour\/[^\s"'<>]+/i);
  if (!m) return "";
  return m[0].replace(/[<)'"]+$/, "").trim();
}

function resolveLegacyHtml(xf, p) {
  let raw = String(xf.tour3d_html || "").trim();
  if (raw && /:\/\//.test(raw)) raw = "";
  let legacy = tour3dService.normalizeLegacyHtml(raw);
  if (!legacy && p.alt_name) {
    legacy = tour3dService.normalizeLegacyHtml(`${p.id}-${String(p.alt_name).trim()}.html`);
  }
  return legacy;
}

async function run() {
  await tour3dService.ensureTable();

  const catIdArg = String(process.env.POSTS_3D_CATEGORY_ID || process.argv[2] || "23").trim();
  const [posts] = await pool.query(
    `SELECT id, title, alt_name, short_story, full_story, xfields FROM ${table("post")} WHERE FIND_IN_SET(?, category) AND approve = 1 ORDER BY id ASC`,
    [catIdArg]
  );

  // eslint-disable-next-line no-console
  console.log(`Категория (ID в FIND_IN_SET): ${catIdArg}, постов: ${(posts || []).length}`);

  let inserted = 0;
  let skipped = 0;

  for (const p of posts || []) {
    const [already] = await pool.query(`SELECT id FROM ${table("tour3d")} WHERE sort_order = ? LIMIT 1`, [
      Number(p.id) || 0
    ]);
    if (already && already.length) {
      // eslint-disable-next-line no-console
      console.log(`⊘ id=${p.id}: уже в abay_tour3d (sort_order)`);
      skipped += 1;
      continue;
    }

    const xf = parseXfields(p.xfields || "");
    let url = String(xf.tour3d_public_url || xf.iframe || xf.mapfull || "").trim();
    url = tour3dService.normalizeMatterportUrl(url);
    if (!tour3dService.isTourEmbedUrl(url)) {
      url = tour3dService.normalizeMatterportUrl(
        extractMatterportFromHtml(p.full_story) || extractMatterportFromHtml(p.short_story)
      );
    }
    if (!tour3dService.isTourEmbedUrl(url)) {
      url = extractTreedisFromHtml(p.full_story) || extractTreedisFromHtml(p.short_story);
    }
    if (!tour3dService.isTourEmbedUrl(url)) {
      // eslint-disable-next-line no-console
      console.warn(`Пропуск id=${p.id}: нет ссылки Matterport / Treedis`);
      skipped += 1;
      continue;
    }
    const poster = String(xf.poster || "").split("|")[0].trim() || null;
    const legacy = resolveLegacyHtml(xf, p);
    if (legacy && (await tour3dService.isLegacyHtmlTaken(legacy))) {
      skipped += 1;
      continue;
    }
    await tour3dService.create({
      title: String(p.title || "3D тур").trim() || "3D тур",
      matterport_url: url,
      poster,
      short_story: String(p.short_story || "").trim() || null,
      full_story: String(p.full_story || "").trim() || null,
      legacy_html: legacy || null,
      sort_order: Number(p.id) || 0,
      is_published: 1
    });
    inserted += 1;
    // eslint-disable-next-line no-console
    console.log(`+ id=${p.id} → ${url}`);
  }

  // eslint-disable-next-line no-console
  console.log(`\nГотово: добавлено ${inserted}, пропущено ${skipped}.`);
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
