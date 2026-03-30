const pool = require("../db/pool");
const { db } = require("../config/env");
const { CATEGORY_3D_SLUG } = require("../config/contentSections");
const { parseI18n, PRIMARY_LOCALE } = require("../../../hotels/utils/i18n");

function table(name) {
  return `\`${db.prefix}_${name}\``;
}

function decodeLegacyPipes(str) {
  return String(str || "").replace(/&#124;/g, "|");
}

function normalizeUploadsUrls(text) {
  return String(text || "").replace(
    /https?:\/\/(?:[^/\s]+\.)?[^/\s]*\/?(?:visitabay\.kz\/)?uploads\//gi,
    "/uploads/"
  );
}

function normalizeDleRichHtml(html) {
  let out = String(html || "");

  // DB sometimes contains escaped quotes like \" which breaks HTML.
  out = out.replace(/\\"/g, '"');

  // Fix DLE video block typo that breaks layout.
  out = out.replace(/max-width\s*:\s*1000pxpx\s*;?/gi, "max-width:1000px;");

  // Normalize upload URLs inside rich HTML too.
  out = normalizeUploadsUrls(out);

  return out;
}

function parseXfields(raw) {
  const out = {};
  const src = normalizeUploadsUrls(decodeLegacyPipes(raw));
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

function parseImageFieldValue(v) {
  // DLE image payload: path|thumb|medium|size|humanSize
  const s = String(v || "");
  const first = s.split("|")[0] || "";
  return first.trim();
}

function parseGalleryField(v) {
  const s = String(v || "").trim();
  if (!s) return [];
  return s
    .split(",")
    .map((item) => parseImageFieldValue(item))
    .filter(Boolean);
}

function asMediaUrl(path) {
  if (!path) return "";
  const normalized = normalizeUploadsUrls(String(path));
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (/^\/uploads\//i.test(normalized)) return normalized;
  return `/uploads/${normalized.replace(/^\/+/, "")}`;
}

function enrichPost(post) {
  const shortStory = normalizeDleRichHtml(post.short_story || "");
  const fullStory = normalizeDleRichHtml(post.full_story || "");
  const xfields = parseXfields(post.xfields || "");
  const poster = parseImageFieldValue(xfields.poster || "");
  const gallery = parseGalleryField(xfields.gallery || "");
  return {
    ...post,
    short_story: shortStory,
    full_story: fullStory,
    xfields,
    poster: poster ? asMediaUrl(poster) : "",
    gallery: gallery.map(asMediaUrl)
  };
}

async function getLatestPosts(limit = 10) {
  const sql = `
    SELECT id, title, alt_name, short_story, date, category, xfields
    FROM ${table("post")}
    WHERE approve = 1
    ORDER BY date DESC
    LIMIT ?
  `;
  const [rows] = await pool.query(sql, [limit]);
  return rows.map(enrichPost);
}

async function getPostByAltName(altName) {
  const sql = `
    SELECT id, title, alt_name, short_story, full_story, date, category, xfields, descr, keywords
    FROM ${table("post")}
    WHERE alt_name = ? AND approve = 1
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [altName]);
  return rows[0] ? enrichPost(rows[0]) : null;
}

async function getPostById(id) {
  const n = Number(id);
  if (!n || n < 1) return null;
  const sql = `
    SELECT id, title, alt_name, short_story, full_story, date, category, xfields, descr, keywords
    FROM ${table("post")}
    WHERE id = ? AND approve = 1
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [n]);
  return rows[0] ? enrichPost(rows[0]) : null;
}

async function getCategoryByAltName(altName) {
  const sql = `
    SELECT id, name, alt_name, descr, fulldescr, metatitle, keywords, i18n
    FROM ${table("category")}
    WHERE alt_name = ? AND active = 1
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [altName]);
  return rows[0] || null;
}

function applyPostLocale(post, locale) {
  if (!post) return post;
  const loc = locale || PRIMARY_LOCALE;
  const xf = post.xfields || {};
  function pick(suf) {
    const tTitle = xf[`title_${suf}`];
    const tShort = xf[`short_story_${suf}`];
    const tFull = xf[`full_story_${suf}`];
    const tDescr = xf[`descr_${suf}`];
    const tMeta = xf[`metatitle_${suf}`];
    if (!tTitle && !tShort && !tFull && !tDescr && !tMeta) return null;
    return {
      title: tTitle || post.title,
      short_story: tShort ? normalizeDleRichHtml(tShort) : post.short_story,
      full_story: tFull ? normalizeDleRichHtml(tFull) : post.full_story,
      descr: tDescr || post.descr,
      metatitle: tMeta || post.metatitle
    };
  }
  if (loc === PRIMARY_LOCALE) {
    const o = pick(PRIMARY_LOCALE);
    if (!o) return post;
    return { ...post, ...o };
  }
  if (loc === "kk") {
    const o = pick("kk");
    if (!o) return post;
    return { ...post, ...o };
  }
  if (loc === "en") {
    const o = pick("en");
    if (!o) return post;
    return { ...post, ...o };
  }
  return post;
}

function stripHtml(s) {
  return String(s || "").replace(/<[^>]*>/g, "").trim();
}

function hasLocaleContent(post, locale) {
  if (!post) return false;
  const loc = locale || PRIMARY_LOCALE;
  const xf = post.xfields || {};
  function xfNonEmpty(suf) {
    const keys = [
      `title_${suf}`,
      `short_story_${suf}`,
      `full_story_${suf}`,
      `descr_${suf}`,
      `metatitle_${suf}`
    ];
    return keys.some((k) => String(xf[k] || "").trim() !== "");
  }
  if (loc === "en") return xfNonEmpty("en");
  if (loc === "kk") return xfNonEmpty("kk");
  if (loc === PRIMARY_LOCALE) {
    if (xfNonEmpty(PRIMARY_LOCALE)) return true;
    return [post.title, post.short_story, post.full_story, post.descr, post.metatitle].some(
      (v) => stripHtml(v) !== ""
    );
  }
  return true;
}

function filterPostsByLocale(posts, locale) {
  const arr = Array.isArray(posts) ? posts : [];
  return arr.filter((p) => hasLocaleContent(p, locale));
}

function applyCategoryLocale(category, locale) {
  if (!category) return category;
  const loc = locale || PRIMARY_LOCALE;
  const bag = parseI18n(category.i18n);
  if (loc === PRIMARY_LOCALE) {
    if (bag && bag[PRIMARY_LOCALE]) {
      const t = bag[PRIMARY_LOCALE];
      return {
        ...category,
        name: t.name || category.name,
        descr: t.descr !== undefined && String(t.descr).trim() !== "" ? t.descr : category.descr,
        fulldescr:
          t.fulldescr !== undefined && String(t.fulldescr).trim() !== "" ? t.fulldescr : category.fulldescr,
        metatitle:
          t.metatitle !== undefined && String(t.metatitle).trim() !== "" ? t.metatitle : category.metatitle
      };
    }
    return category;
  }
  if ((loc === "kk" || loc === "en") && bag && bag[loc]) {
    const t = bag[loc];
    return {
      ...category,
      name: t.name || category.name,
      descr: t.descr !== undefined && String(t.descr).trim() !== "" ? t.descr : category.descr,
      fulldescr:
        t.fulldescr !== undefined && String(t.fulldescr).trim() !== "" ? t.fulldescr : category.fulldescr,
      metatitle:
        t.metatitle !== undefined && String(t.metatitle).trim() !== "" ? t.metatitle : category.metatitle
    };
  }
  return category;
}

async function getCategoriesBySlugs(slugs) {
  if (!Array.isArray(slugs) || !slugs.length) return [];
  const marks = slugs.map(() => "?").join(",");
  const sql = `
    SELECT id, name, alt_name, descr, fulldescr, metatitle, keywords
    FROM ${table("category")}
    WHERE active = 1 AND alt_name IN (${marks})
  `;
  const [rows] = await pool.query(sql, slugs);
  return rows;
}

async function getPostsByCategoryId(categoryId, limit = 30) {
  const sql = `
    SELECT id, title, alt_name, short_story, date, category, xfields
    FROM ${table("post")}
    WHERE approve = 1 AND FIND_IN_SET(?, category)
    ORDER BY date DESC
    LIMIT ?
  `;
  const [rows] = await pool.query(sql, [String(categoryId), limit]);
  return rows.map(enrichPost);
}

async function getPostsByCategorySlug(categorySlug, limit = 10) {
  const category = await getCategoryByAltName(categorySlug);
  if (!category) return { category: null, posts: [] };
  const posts = await getPostsByCategoryId(category.id, limit);
  return { category, posts };
}

async function getStaticPageByName(name) {
  const sql = `
    SELECT id, name, descr, template, metadescr, metakeys, metatitle, date
    FROM ${table("static")}
    WHERE name = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [name]);
  if (!rows[0]) return null;
  return {
    ...rows[0],
    template: normalizeUploadsUrls(rows[0].template || "")
  };
}

async function getPostByLegacyHtmlPath(pathname) {
  // DLE old style can be ".../<id-slug>.html" or ".../<slug>.html".
  const clean = (pathname || "").replace(/^\/+/, "").replace(/\.html$/i, "");
  const last = clean.split("/").pop() || "";
  const slug = last.replace(/^\d+-/, "");
  if (!slug) return null;
  return getPostByAltName(slug);
}

function geoBlobFromXfields(xf) {
  const o = xf && typeof xf === "object" ? xf : {};
  return [o.mapfull, o.linkmap, o.contactfullstory, o.address, o.location, o.link]
    .map((s) => String(s || ""))
    .join(" ");
}

/**
 * Координаты из типичных вставок Google Maps (!2d/!3d, @lat,lng, ll=, q=lat,lng).
 */
function extractLatLngFromText(text) {
  const s = String(text || "");
  if (!s.trim()) return null;
  let m = s.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]), precise: true };
  m = s.match(/!3d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), precise: true };
  m = s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), precise: true };
  m = s.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), precise: true };
  m = s.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:&|$|[\"'\s])/i);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]), precise: true };
  return null;
}

/** Условный «центр населённого пункта», если в тексте есть город, но нет точных координат */
function inferCityCenter(blob) {
  const t = String(blob || "").toLowerCase();
  if (/(семей|семипалатинск)/.test(t)) return { lat: 50.4111, lng: 80.2275, key: "semey" };
  if (/курчатов/.test(t)) return { lat: 50.7561, lng: 78.5478, key: "kurchatov" };
  if (/зыряновск/.test(t)) return { lat: 49.7456, lng: 84.2722, key: "zyryanovsk" };
  if (/аягуз|аягөз/.test(t)) return { lat: 47.9645, lng: 80.4394, key: "ayagoz" };
  if (/(экибастуз|екібастұз)/.test(t)) return { lat: 51.7291, lng: 75.3225, key: "ekibastuz" };
  return null;
}

function resolveGeoPoint(xf) {
  const blob = geoBlobFromXfields(xf);
  const direct = extractLatLngFromText(blob);
  if (direct) return { lat: direct.lat, lng: direct.lng, precise: !!direct.precise, key: null };
  const city = inferCityCenter(blob);
  if (city) return { lat: city.lat, lng: city.lng, precise: false, key: city.key };
  return null;
}

function haversineKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/**
 * «Ближайшие объекты»: те же категории, сортировка по расстоянию (точка из карты / город из текста).
 * Постов без гео — в конец, по дате.
 */
async function getRelatedPostsNearest(enrichedPost, limit = 6) {
  if (!enrichedPost || !enrichedPost.id) return [];

  const postId = enrichedPost.id;
  const categoryCsv = enrichedPost.category;
  const categories = String(categoryCsv || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!categories.length) return [];

  const anchor = resolveGeoPoint(enrichedPost.xfields);

  const ors = categories.map(() => "FIND_IN_SET(?, category)").join(" OR ");
  const fetchLimit = Math.min(300, Math.max(limit * 25, Math.floor(limit * 15)));
  const sql = `
    SELECT id, title, alt_name, short_story, date, category, xfields
    FROM ${table("post")}
    WHERE approve = 1 AND id <> ? AND (${ors})
    ORDER BY date DESC
    LIMIT ?
  `;
  const params = [postId, ...categories, fetchLimit];
  const [rows] = await pool.query(sql, params);
  const posts = rows.map(enrichPost);

  const scored = posts.map((p) => {
    const pt = resolveGeoPoint(p.xfields);
    let km = Infinity;
    if (anchor && pt) {
      km = haversineKm(anchor, pt);
      if (!anchor.precise && !pt.precise && anchor.key && pt.key && anchor.key === pt.key) km = 0;
    }
    const t = new Date(p.date || 0).getTime();
    return { p, km, t };
  });

  scored.sort((A, B) => {
    const aInf = !Number.isFinite(A.km) || A.km === Infinity;
    const bInf = !Number.isFinite(B.km) || B.km === Infinity;
    if (!aInf && !bInf && A.km !== B.km) return A.km - B.km;
    if (aInf !== bInf) return aInf ? 1 : -1;
    return B.t - A.t;
  });

  return scored.slice(0, limit).map((x) => x.p);
}

/** @deprecated для шаблонов используйте getRelatedPostsNearest */
async function getRelatedPosts(postId, categoryCsv, limit = 6) {
  const categories = String(categoryCsv || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!categories.length) return [];

  const ors = categories.map(() => "FIND_IN_SET(?, category)").join(" OR ");
  const sql = `
    SELECT id, title, alt_name, short_story, date, category, xfields
    FROM ${table("post")}
    WHERE approve = 1 AND id <> ? AND (${ors})
    ORDER BY date DESC
    LIMIT ?
  `;
  const params = [postId, ...categories, limit];
  const [rows] = await pool.query(sql, params);
  return rows.map(enrichPost);
}

async function getAllPublishedPosts(limit = 50000) {
  const sql = `
    SELECT id, alt_name, date, category, xfields
    FROM ${table("post")}
    WHERE approve = 1 AND alt_name <> ''
    ORDER BY date DESC
    LIMIT ?
  `;
  const [rows] = await pool.query(sql, [limit]);
  return rows;
}

/** Постер или первое фото галереи из обогащённого поста DLE. */
function firstCoverFromPost(post) {
  if (!post) return "";
  const p = String(post.poster || "").trim();
  if (p) return p;
  if (post.gallery && post.gallery.length) return String(post.gallery[0] || "").trim();
  return "";
}

/**
 * Ищет пост с tour3d_html = fileName среди всех опубликованных (если пост убрали из категории 3d или лимит списка).
 */
async function findPostByTour3dLegacyHtml(want) {
  const needle = String(want || "").trim().toLowerCase();
  if (!needle || !needle.endsWith(".html")) return null;
  const like = `%tour3d_html|${needle}%`;
  const sql = `
    SELECT id, title, alt_name, short_story, full_story, date, category, xfields, descr, keywords
    FROM ${table("post")}
    WHERE approve = 1 AND alt_name <> '' AND xfields LIKE ?
    LIMIT 80
  `;
  const [rows] = await pool.query(sql, [like]);
  for (const row of rows || []) {
    const p = enrichPost(row);
    const fn = String((p.xfields && p.xfields.tour3d_html) || "").trim().toLowerCase();
    if (fn === needle) return p;
  }
  return null;
}

/** Пост категории 3D по legacy-имени файла (tour3d_html), для /3d/*.html без записи в abay_tour3d. */
async function getPostByTour3dHtml(fileName) {
  const want = String(fileName || "").trim().toLowerCase();
  if (!want || !want.endsWith(".html")) return null;
  const cat = await getCategoryByAltName(CATEGORY_3D_SLUG);
  if (cat) {
    const posts = await getPostsByCategoryId(cat.id, 3000);
    for (const p of posts) {
      const fn = String((p.xfields && p.xfields.tour3d_html) || "").trim().toLowerCase();
      if (fn === want) return getPostByAltName(p.alt_name);
    }
  }
  return findPostByTour3dLegacyHtml(want);
}

async function getAllActiveCategories() {
  const sql = `
    SELECT id, alt_name
    FROM ${table("category")}
    WHERE active = 1 AND alt_name <> ''
    ORDER BY id ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

async function getAllStaticPages() {
  const sql = `
    SELECT id, name, date
    FROM ${table("static")}
    WHERE name <> ''
    ORDER BY id ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

module.exports = {
  getLatestPosts,
  getPostByAltName,
  getPostById,
  getCategoryByAltName,
  applyPostLocale,
  hasLocaleContent,
  filterPostsByLocale,
  applyCategoryLocale,
  getCategoriesBySlugs,
  getPostsByCategoryId,
  getPostsByCategorySlug,
  getStaticPageByName,
  getPostByLegacyHtmlPath,
  getRelatedPosts,
  getRelatedPostsNearest,
  getAllPublishedPosts,
  getPostByTour3dHtml,
  firstCoverFromPost,
  findPostByTour3dLegacyHtml,
  getAllActiveCategories,
  getAllStaticPages,
  parseXfields,
  parseGalleryField,
  asMediaUrl,
  normalizeUploadsUrls
};
