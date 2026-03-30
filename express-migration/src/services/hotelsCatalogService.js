// Use exactly the same DB connection as hotel routes (/hotel/:slug),
// so cards on homepage and hotel detail always show consistent images.
const hotelsPool = require("../../../hotels/config/db");
const { applyRowLocale, PRIMARY_LOCALE } = require("../../../hotels/utils/i18n");

function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const s = url.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

function parseImageUrls(row) {
  const urls = [];
  // Prefer explicit main image first; in old records image_urls can be stale.
  if (row.image_url) {
    urls.push(row.image_url);
  }
  if (row.image_urls != null) {
    try {
      const raw = typeof row.image_urls === "string" ? JSON.parse(row.image_urls) : row.image_urls;
      if (Array.isArray(raw)) {
        raw.forEach((u) => {
          if (u && !urls.includes(u)) urls.push(u);
        });
      }
    } catch (_) {
      // ignore broken JSON; keep image_url fallback above
    }
  }
  return urls.map(normalizeImageUrl).filter(Boolean);
}

const PLACEHOLDER_IMG =
  "https://placehold.co/640x360/e8e8e8/666?text=%D0%93%D0%BE%D1%81%D1%82%D0%B8%D0%BD%D0%B8%D1%86%D0%B0";

/**
 * Карточки для блока «Где остановиться» на странице поста (ссылки на /hotel/...).
 */
async function listForPostPage(limit = 8, locale = PRIMARY_LOCALE) {
  try {
    const lim = Math.min(Math.max(parseInt(String(limit), 10) || 8, 1), 24);
    const [rows] = await hotelsPool.query(
      `SELECT id, name, slug, location, price, image_url, image_urls, i18n, address, description
       FROM hotels
       ORDER BY name ASC
       LIMIT ?`,
      [lim]
    );
    return (rows || []).map((r) => {
      const imgs = parseImageUrls(r);
      const slugPart = r.slug && String(r.slug).trim() ? String(r.slug).trim() : String(r.id);
      const cardImage = imgs.length ? imgs[0] : PLACEHOLDER_IMG;
      const loc = applyRowLocale(
        {
          id: r.id,
          name: r.name,
          location: r.location,
          i18n: r.i18n,
          address: r.address,
          description: r.description
        },
        locale
      );
      return {
        id: r.id,
        name: loc.name,
        slug: r.slug,
        location:
          loc.location && String(loc.location).trim()
            ? String(loc.location).trim()
            : "Семей, Казахстан",
        price: r.price && String(r.price).trim() ? String(r.price).trim() : "",
        cardImage,
        hotelUrl: `/hotel/${encodeURIComponent(slugPart)}`
      };
    });
  } catch (err) {
    console.warn("[hotelsCatalogService] listForPostPage:", err.message);
    return [];
  }
}

module.exports = { listForPostPage };
