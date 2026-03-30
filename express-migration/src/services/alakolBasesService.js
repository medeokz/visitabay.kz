const hotelsPool = require("../../../hotels/config/db");
const { applyRowLocale, PRIMARY_LOCALE } = require("../../../hotels/utils/i18n");

function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const s = url.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

function parseImageUrlsRow(row) {
  const urls = [];
  if (row.image_url) urls.push(row.image_url);
  if (row.image_urls != null) {
    try {
      const raw = typeof row.image_urls === "string" ? JSON.parse(row.image_urls) : row.image_urls;
      if (Array.isArray(raw)) {
        raw.forEach((u) => {
          if (u && !urls.includes(u)) urls.push(u);
        });
      }
    } catch (_) {}
  }
  return urls.map(normalizeImageUrl).filter(Boolean);
}

const PLACEHOLDER =
  "https://placehold.co/640x360/e8e8e8/666?text=%D0%91%D0%B0%D0%B7%D0%B0+%D0%BE%D1%82%D0%B4%D1%8B%D1%85%D0%B0";

/** Озеро Алаколь — Wikimedia / ESA–Copernicus Sentinel-2 (~2880px), CC контента Commons */
const DEFAULT_HOME_HERO_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Alakol_Lake_ESA365539.jpg/3840px-Alakol_Lake_ESA365539.jpg";

async function listForHome(limit = 12, locale = PRIMARY_LOCALE) {
  try {
    const lim = Math.min(Math.max(parseInt(String(limit), 10) || 12, 1), 48);
    const [rows] = await hotelsPool.query(
      `SELECT id, name, slug, location, price, image_url, image_urls, sort_order, i18n, address, description
       FROM alakol_bases WHERE is_published = 1
       ORDER BY sort_order ASC, name ASC
       LIMIT ?`,
      [lim]
    );
    return (rows || []).map((r) => {
      const imgs = parseImageUrlsRow(r);
      const slugPart = r.slug && String(r.slug).trim() ? String(r.slug).trim() : String(r.id);
      const locRow = applyRowLocale(
        {
          id: r.id,
          name: r.name,
          location: r.location,
          price: r.price,
          i18n: r.i18n,
          address: r.address,
          description: r.description
        },
        locale
      );
      return {
        id: r.id,
        name: locRow.name,
        slug: r.slug,
        location:
          locRow.location && String(locRow.location).trim()
            ? String(locRow.location).trim()
            : "Алаколь",
        price: r.price && String(r.price).trim() ? String(r.price).trim() : "",
        cardImage: imgs.length ? imgs[0] : PLACEHOLDER,
        detailUrl: `/baza-alakol/${encodeURIComponent(slugPart)}`
      };
    });
  } catch (err) {
    console.warn("[alakolBasesService] listForHome:", err.message);
    return [];
  }
}

module.exports = {
  listForHome,
  parseImageUrlsRow,
  normalizeImageUrl,
  PLACEHOLDER,
  DEFAULT_HOME_HERO_IMAGE
};
