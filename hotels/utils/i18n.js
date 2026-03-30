/**
 * Мультиязычность: основной язык контента в БД — русский (ru) — колонки name/title/…
 * Доп. переводы: i18n JSON { "kk": {...}, "en": {...} } и поля xfields для DLE-постов.
 */
const PRIMARY_LOCALE = "ru";
const ALT_LOCALES = ["ru", "en"];
const COOKIE_NAME = "visitabay_lang";
const SUPPORTED = new Set(["ru", "kk", "en"]);

function normalizeLang(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase();
  if (s === "kz") return "kk";
  if (SUPPORTED.has(s)) return s;
  return null;
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

/** body.i18n: только ru / en → JSON для БД */
function normalizeI18nFromBody(body) {
  const src = body && body.i18n;
  if (!src || typeof src !== "object") return null;
  const out = {};
  for (const loc of ALT_LOCALES) {
    const part = src[loc];
    if (!part || typeof part !== "object") continue;
    const entry = {};
    for (const key of ["name", "description", "address", "location"]) {
      if (part[key] != null && String(part[key]).trim()) {
        entry[key] = String(part[key]).trim();
      }
    }
    if (Object.keys(entry).length) out[loc] = entry;
  }
  return Object.keys(out).length ? JSON.stringify(out) : null;
}

function mergeOverlay(row, overlay) {
  if (!overlay || typeof overlay !== "object") return row;
  const t = overlay;
  const next = { ...row };
  if (t.name) next.name = t.name;
  if (t.description !== undefined && String(t.description).trim() !== "") next.description = t.description;
  if (t.address !== undefined && String(t.address).trim() !== "") next.address = t.address;
  if (t.location !== undefined && String(t.location).trim() !== "") next.location = t.location;
  return next;
}

function applyRowLocale(row, locale) {
  if (!row) return row;
  const loc = locale || PRIMARY_LOCALE;
  const bag = parseI18n(row.i18n);
  if (loc === PRIMARY_LOCALE) {
    if (bag && bag[PRIMARY_LOCALE] && typeof bag[PRIMARY_LOCALE] === "object" && Object.keys(bag[PRIMARY_LOCALE]).length) {
      return mergeOverlay(row, bag[PRIMARY_LOCALE]);
    }
    return row;
  }
  if (bag && bag[loc] && typeof bag[loc] === "object" && Object.keys(bag[loc]).length) {
    return mergeOverlay(row, bag[loc]);
  }
  return row;
}

function normalizeRoomI18nFromBody(room) {
  const src = room && room.i18n;
  if (!src || typeof src !== "object") return null;
  const out = {};
  for (const loc of ALT_LOCALES) {
    const part = src[loc];
    if (!part || typeof part !== "object") continue;
    const n = part.name != null ? String(part.name).trim() : "";
    if (n) out[loc] = { name: n };
  }
  return Object.keys(out).length ? JSON.stringify(out) : null;
}

function applyRoomLocale(room, locale) {
  if (!room) return room;
  const loc = locale || PRIMARY_LOCALE;
  const bag = parseI18n(room.i18n);
  if (loc === PRIMARY_LOCALE) {
    if (bag && bag[PRIMARY_LOCALE] && bag[PRIMARY_LOCALE].name) return { ...room, name: bag[PRIMARY_LOCALE].name };
    return room;
  }
  if (bag && bag[loc] && bag[loc].name) return { ...room, name: bag[loc].name };
  return room;
}

module.exports = {
  PRIMARY_LOCALE,
  ALT_LOCALES,
  COOKIE_NAME,
  SUPPORTED,
  normalizeLang,
  parseI18n,
  normalizeI18nFromBody,
  normalizeRoomI18nFromBody,
  applyRowLocale,
  applyRoomLocale
};
