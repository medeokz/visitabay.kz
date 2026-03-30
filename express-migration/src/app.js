const path = require("path");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");
const siteRoutes = require("./routes/siteRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middlewares/errorHandler");
const localeMiddleware = require("./middleware/locale");
const { publicBasePath, nodeEnv } = require("./config/env");

const hotelsPool = require("../../hotels/config/db");
const hotelsApiHotels = require("../../hotels/routes/api/hotels");
const hotelsApiAlakolBases = require("../../hotels/routes/api/alakolBases");
const hotelsApiBookings = require("../../hotels/routes/api/bookings");
const adminAlakolBasesRoutes = require("../../hotels/routes/adminAlakolBases");
const hotelsApiPush = require("../../hotels/routes/api/push");
const hotelsUploadRoutes = require("../../hotels/routes/upload");
const hotelsAdminRoutes = require("../../hotels/routes/admin");
const hotelsOwnerRoutes = require("../../hotels/routes/owner");
const { labelsForAmenityKeys } = require("../../hotels/utils/amenityLabels");
const { applyRowLocale, applyRoomLocale, PRIMARY_LOCALE } = require("../../hotels/utils/i18n");
const { getMenuFooter } = require("./i18n/menuFooterI18n");
const { getHotelsCatalog, getHotelsDetail } = require("./i18n/hotelsPageI18n");

const app = express();
const isProd = nodeEnv === "production";
const hotelsViewsDir = path.join(__dirname, "..", "..", "hotels", "views");
const hotelsPublicDir = path.join(__dirname, "..", "..", "hotels", "public");

// Reverse proxy awareness for production (nginx/apache/ingress).
if (process.env.TRUST_PROXY != null && String(process.env.TRUST_PROXY).trim() !== "") {
  const raw = String(process.env.TRUST_PROXY).trim().toLowerCase();
  const v = raw === "true" ? true : raw === "false" ? false : Number.isNaN(Number(raw)) ? raw : Number(raw);
  app.set("trust proxy", v);
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const s = url.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

const FALLBACK_HOTEL_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#2a2a2a" width="400" height="300"/><text fill="#888" x="200" y="155" text-anchor="middle" font-size="18" font-family="sans-serif">Нет фото</text></svg>'
  );
const FALLBACK_HOTEL_IMAGE_HTTPS =
  "https://placehold.co/600x340/2a2a2a/888?text=%D0%9D%D0%B5%D1%82+%D1%84%D0%BE%D1%82%D0%BE";

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    // Иначе часть браузеров/прокси режет кросс-доменные шрифты/CSS; сайт «голый», хотя файлы по прямой ссылке открываются.
    crossOriginResourcePolicy: false
  })
);
app.use(morgan(isProd ? "combined" : "dev"));
const corsOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors(
    corsOrigins.length
      ? {
          origin(origin, cb) {
            if (!origin || corsOrigins.includes(origin)) return cb(null, true);
            return cb(new Error("CORS blocked"), false);
          }
        }
      : {}
  )
);
app.use(cookieParser());
// Абсолютные URL статики в шаблонах (прокси/X-Forwarded-*): избегает битых относительных href.
app.use((req, res, next) => {
  const xfProto = (req.get("x-forwarded-proto") || "").split(",")[0].trim();
  const proto = xfProto || req.protocol || "https";
  const hostRaw = req.get("x-forwarded-host") || req.get("host") || "";
  const host = hostRaw.split(",")[0].trim();
  if (host && (isProd || String(process.env.ASSET_ABSOLUTE_URLS || "").trim() === "1")) {
    res.locals.absoluteBase = `${proto}://${host}`;
  } else {
    res.locals.absoluteBase = "";
  }
  next();
});
app.use(localeMiddleware);
app.use((req, res, next) => {
  const mf = res.locals.menuFooter;
  const ok =
    mf &&
    mf.header &&
    mf.footer &&
    mf.home &&
    mf.hotelsCatalog &&
    typeof mf.header.menuAbay === "string" &&
    typeof mf.home.popularH2 === "string" &&
    typeof mf.hotelsCatalog.listingTitle === "string";
  if (!ok) {
    res.locals.menuFooter = getMenuFooter(res.locals.lang || PRIMARY_LOCALE);
  }
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
if (isProd && (!process.env.SESSION_SECRET || String(process.env.SESSION_SECRET).trim().length < 24)) {
  throw new Error(
    "SESSION_SECRET must be set (>= 24 chars) when NODE_ENV=production. " +
      "В панели хостинга (Passenger/Environment) добавьте переменную SESSION_SECRET или задайте её в express-migration/.env"
  );
}
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-me",
    name: process.env.SESSION_COOKIE_NAME || "visitabay.sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // За прокси без TRUST_PROXY Express может не видеть HTTPS; тогда COOKIE_SECURE=0 временно.
      secure: isProd && String(process.env.COOKIE_SECURE || "").trim() !== "0",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.set("view engine", "ejs");
app.set("views", [path.join(__dirname, "views"), hotelsViewsDir]);
const hotelsThemeBase = publicBasePath ? `${publicBasePath}/visitabay` : "/visitabay";
app.locals.themeBase = publicBasePath
  ? `${publicBasePath}/assets/templates/visitabay`
  : "/assets/templates/visitabay";
app.locals.siteUrl = publicBasePath ? `${publicBasePath}/` : "/";
app.locals.basePath = publicBasePath;
app.locals.browserAdminBase = "/admin/hotels";
app.locals.fallbackHotelImage = FALLBACK_HOTEL_IMAGE;
app.locals.fallbackHotelImageHttps = FALLBACK_HOTEL_IMAGE_HTTPS;
app.locals.defaultMenuFooter = getMenuFooter(PRIMARY_LOCALE);
app.use((req, res, next) => {
  res.locals.adminWebRoot = "/admin/hotels";
  next();
});

// Static assets reuse from current DLE template/public folders.
app.use("/assets/templates", express.static(path.join(__dirname, "..", "..", "templates")));
app.use("/assets/public", express.static(path.join(__dirname, "..", "..", "public")));
app.use("/assets/migration", express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(path.join(__dirname, "..", "..", "uploads")));
// Backward compatibility: previously hotel uploads were saved in hotels/public/uploads.
app.use("/uploads", express.static(path.join(hotelsPublicDir, "uploads")));

// Hotels static assets.
app.use("/css", express.static(path.join(hotelsPublicDir, "css")));
app.use("/js", express.static(path.join(hotelsPublicDir, "js")));
app.use("/visitabay", express.static(path.join(hotelsPublicDir, "visitabay")));
app.get("/sw.js", (req, res) => res.sendFile(path.join(hotelsPublicDir, "sw.js")));

// Content admin.
app.use("/admin", adminRoutes);

// Health endpoint for load balancer / uptime probes.
app.get("/healthz", (req, res) => {
  res.status(200).json({ ok: true, env: nodeEnv });
});

// Контентный админ-логин под путём /admin/login.
// Чтобы при входе в /admin адрес не уводило в /admin/hotels/*.
app.get("/admin/login", (req, res) => {
  const admin = req.session && req.session.admin;
  if (admin) {
    const to = admin.role === "owner" ? `${publicBasePath || ""}/owner` : "/admin";
    return res.redirect(302, to);
  }
  // Используем тот же EJS-шаблон, который есть в hotels/views/admin/login.ejs
  return res.render("admin/login", { error: null });
});
app.get("/hotels-admin", (req, res) => res.redirect(301, "/admin/hotels"));
app.use("/hotels-admin", (req, res) => res.redirect(301, `/admin/hotels${req.url}`));
app.use("/admin/hotels/alakol-bases", adminAlakolBasesRoutes);
app.use("/admin/hotels", hotelsAdminRoutes);
app.use("/owner", hotelsOwnerRoutes);
app.use("/api/hotels", hotelsApiHotels);
app.use("/api/alakol-bases", hotelsApiAlakolBases);
app.use("/api/bookings", hotelsApiBookings);
app.use("/api/push", hotelsApiPush);
app.use("/api/upload", hotelsUploadRoutes);

app.get("/hotels/hotel/:slug", (req, res) => {
  res.redirect(301, `/hotel/${encodeURIComponent(String(req.params.slug || ""))}`);
});

app.get("/hotels", async (req, res) => {
  try {
    const locale = req.locale || PRIMARY_LOCALE;
    const [rows] = await hotelsPool.query(
      "SELECT id, name, slug, location, price, address, latitude, longitude, image_url, image_urls, description, i18n FROM hotels ORDER BY name"
    );
    const hotels = (rows || []).map((h) => {
      let urls = [];
      if (h.image_urls != null) {
        try {
          urls = typeof h.image_urls === "string" ? JSON.parse(h.image_urls) : h.image_urls;
          if (!Array.isArray(urls)) urls = [];
        } catch (_err) {
          urls = [];
        }
      }
      if (!urls.length && h.image_url) urls = [h.image_url];
      if (!urls.length) urls = [FALLBACK_HOTEL_IMAGE_HTTPS];
      urls = urls.filter(Boolean).map(normalizeImageUrl).filter(Boolean);
      if (!urls.length) urls = [FALLBACK_HOTEL_IMAGE_HTTPS];
      return { ...h, image_urls: urls };
    });
    const [ratingRows] = await hotelsPool.query(
      "SELECT hotel_id, ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count FROM hotel_reviews WHERE rating IS NOT NULL GROUP BY hotel_id"
    );
    const ratingByHotel = {};
    (ratingRows || []).forEach((r) => {
      ratingByHotel[r.hotel_id] = { avgRating: parseFloat(r.avg_rating), reviewCount: r.review_count };
    });
    hotels.forEach((h) => {
      const r = ratingByHotel[h.id];
      h.avgRating = r ? r.avgRating : null;
      h.reviewCount = r ? r.reviewCount : 0;
    });
    const hotelsLoc = hotels.map((h) => applyRowLocale(h, locale));
    const mapCenter = { lat: 50.4114, lng: 80.2275 };
    const hc = getHotelsCatalog(locale);
    res.render(path.join(hotelsViewsDir, "index.ejs"), {
      hotels: hotelsLoc,
      mapCenter,
      basePath: publicBasePath,
      lang: locale,
      themeBase: hotelsThemeBase,
      listingTitle: hc.listingTitle,
      listingHeroTitle: hc.listingHeroTitle,
      listingHeroAlt: hc.listingHeroAlt,
      listingIntro: hc.listingIntroDefault,
      mapModalTitle: hc.mapModalTitleHotels,
      mapAriaLabel: hc.mapAriaHotels,
      geocodeDefault: hc.mapGeocodeSemey,
      mapPlaceFallbackName: hc.mapPlaceHotel,
      listingEmptyMessage: hc.emptyHotels,
      fallbackHotelImage: FALLBACK_HOTEL_IMAGE,
      fallbackHotelImageHttps: FALLBACK_HOTEL_IMAGE_HTTPS
    });
  } catch (err) {
    const loc = req.locale || PRIMARY_LOCALE;
    const hc = getHotelsCatalog(loc);
    res.render(path.join(hotelsViewsDir, "index.ejs"), {
      hotels: [],
      error: hc.errorLoad,
      mapCenter: { lat: 50.4114, lng: 80.2275 },
      basePath: publicBasePath,
      lang: loc,
      themeBase: hotelsThemeBase,
      listingTitle: hc.listingTitle,
      listingHeroTitle: hc.listingHeroTitle,
      listingHeroAlt: hc.listingHeroAlt,
      listingIntro: hc.listingIntroDefault,
      mapModalTitle: hc.mapModalTitleHotels,
      mapAriaLabel: hc.mapAriaHotels,
      geocodeDefault: hc.mapGeocodeSemey,
      mapPlaceFallbackName: hc.mapPlaceHotel,
      listingEmptyMessage: hc.emptyHotels,
      fallbackHotelImage: FALLBACK_HOTEL_IMAGE,
      fallbackHotelImageHttps: FALLBACK_HOTEL_IMAGE_HTTPS
    });
  }
});

app.get("/baza-alakol", async (req, res) => {
  try {
    const locale = req.locale || PRIMARY_LOCALE;
    const [rows] = await hotelsPool.query(
      `SELECT id, name, slug, location, price, address, latitude, longitude, image_url, image_urls, description, i18n
       FROM alakol_bases WHERE is_published = 1 ORDER BY sort_order ASC, name`
    );
    const hotels = (rows || []).map((h) => {
      let urls = [];
      if (h.image_url) urls.push(h.image_url);
      if (h.image_urls != null) {
        try {
          const parsed = typeof h.image_urls === "string" ? JSON.parse(h.image_urls) : h.image_urls;
          if (Array.isArray(parsed)) {
            parsed.forEach((u) => {
              if (u && !urls.includes(u)) urls.push(u);
            });
          }
        } catch (_err) {}
      }
      if (!urls.length) urls = [FALLBACK_HOTEL_IMAGE_HTTPS];
      urls = urls.filter(Boolean).map(normalizeImageUrl).filter(Boolean);
      if (!urls.length) urls = [FALLBACK_HOTEL_IMAGE_HTTPS];
      return { ...h, image_urls: urls, avgRating: null, reviewCount: 0 };
    });
    const hotelsLoc = hotels.map((h) => applyRowLocale(h, locale));
    const mapCenter = { lat: 46.15, lng: 81.45 };
    const mapRegionBounds = { latMin: 45.85, latMax: 46.55, lngMin: 80.65, lngMax: 82.05 };
    const hc = getHotelsCatalog(locale);
    res.render(path.join(hotelsViewsDir, "index.ejs"), {
      hotels: hotelsLoc,
      mapCenter,
      mapRegionBounds,
      lang: locale,
      themeBase: hotelsThemeBase,
      geocodeDefault: hc.mapGeocodeAlakol,
      basePath: publicBasePath,
      fallbackHotelImage: FALLBACK_HOTEL_IMAGE,
      fallbackHotelImageHttps: FALLBACK_HOTEL_IMAGE_HTTPS,
      listingPageKind: "alakol",
      listingTitle: hc.alakolListingTitle,
      listingHeroTitle: hc.alakolHeroTitle,
      listingHeroAlt: hc.alakolHeroTitle,
      listingIntro: hc.alakolIntro,
      listingEmptyMessage: hc.alakolEmptyMessage,
      cardDetailPath: "/baza-alakol",
      mapModalTitle: hc.mapModalTitleAlakol,
      mapAriaLabel: hc.mapAriaAlakol,
      mapPlaceFallbackName: hc.mapPlaceAlakolBase
    });
  } catch (err) {
    const loc = req.locale || PRIMARY_LOCALE;
    const hc = getHotelsCatalog(loc);
    res.render(path.join(hotelsViewsDir, "index.ejs"), {
      hotels: [],
      error: hc.errorLoad,
      mapCenter: { lat: 46.15, lng: 81.45 },
      mapRegionBounds: { latMin: 45.85, latMax: 46.55, lngMin: 80.65, lngMax: 82.05 },
      geocodeDefault: hc.mapGeocodeAlakol,
      basePath: publicBasePath,
      lang: loc,
      themeBase: hotelsThemeBase,
      fallbackHotelImage: FALLBACK_HOTEL_IMAGE,
      fallbackHotelImageHttps: FALLBACK_HOTEL_IMAGE_HTTPS,
      listingPageKind: "alakol",
      listingTitle: hc.alakolListingTitle,
      listingHeroTitle: hc.alakolHeroTitle,
      listingHeroAlt: hc.alakolHeroTitle,
      listingIntro: hc.alakolIntro,
      cardDetailPath: "/baza-alakol",
      mapModalTitle: hc.mapModalTitleAlakol,
      mapAriaLabel: hc.mapAriaAlakol,
      mapPlaceFallbackName: hc.mapPlaceAlakolBase
    });
  }
});

app.get("/baza-alakol/:slug", async (req, res) => {
  try {
    const slugOrId = req.params.slug;
    let rows;
    if (/^\d+$/.test(slugOrId)) {
      rows = (await hotelsPool.query("SELECT * FROM alakol_bases WHERE id = ?", [slugOrId]))[0];
      if (rows.length) {
        const row = rows[0];
        if (row.slug) return res.redirect(302, `/baza-alakol/${encodeURIComponent(row.slug)}`);
      }
    }
    if (!rows || !rows.length) {
      rows = (await hotelsPool.query("SELECT * FROM alakol_bases WHERE slug = ?", [slugOrId]))[0];
    }
    if (!rows || !rows.length) return res.redirect("/baza-alakol");
    const hotel = rows[0];
    if (!hotel.is_published) return res.redirect("/baza-alakol");
    let imageUrls = [];
    if (hotel.image_url) imageUrls.push(hotel.image_url);
    if (hotel.image_urls != null) {
      try {
        const parsed = typeof hotel.image_urls === "string" ? JSON.parse(hotel.image_urls) : hotel.image_urls;
        if (Array.isArray(parsed)) {
          parsed.forEach((u) => {
            if (u && !imageUrls.includes(u)) imageUrls.push(u);
          });
        }
      } catch (_err) {}
    }
    if (!imageUrls.length) imageUrls = [FALLBACK_HOTEL_IMAGE];
    imageUrls = imageUrls.filter(Boolean).map(normalizeImageUrl).filter(Boolean);
    if (!imageUrls.length) imageUrls = [FALLBACK_HOTEL_IMAGE];
    hotel.image_urls = imageUrls;
    hotel.image_url = imageUrls[0];

    const locale = req.locale || PRIMARY_LOCALE;
    const hotelLoc = applyRowLocale(hotel, locale);
    const [relatedRows] = await hotelsPool.query(
      "SELECT id, name, slug, location, price, image_url, i18n FROM alakol_bases WHERE id != ? AND is_published = 1 ORDER BY sort_order ASC, id ASC LIMIT 5",
      [hotel.id]
    );
    const relatedHotels = (relatedRows || []).map((r) =>
      applyRowLocale(
        {
          ...r,
          image_url: r.image_url ? normalizeImageUrl(r.image_url) : FALLBACK_HOTEL_IMAGE
        },
        locale
      )
    );

    res.render(path.join(hotelsViewsDir, "hotel.ejs"), {
      hotel: { ...hotelLoc, amenitiesLabels: [], avgRating: null, reviewCount: 0, rooms: [] },
      relatedHotels,
      reviews: [],
      basePath: publicBasePath,
      lang: locale,
      themeBase: hotelsThemeBase,
      hotelsDetail: getHotelsDetail(locale),
      isAlakolBase: true
    });
  } catch (err) {
    res.redirect("/baza-alakol");
  }
});

app.get("/hotel/:slug", async (req, res) => {
  try {
    const slugOrId = req.params.slug;
    let rows;
    if (/^\d+$/.test(slugOrId)) {
      rows = (await hotelsPool.query("SELECT * FROM hotels WHERE id = ?", [slugOrId]))[0];
      if (rows.length) {
        const hotel = rows[0];
        if (hotel.slug) return res.redirect(302, `/hotel/${encodeURIComponent(hotel.slug)}`);
      }
    }
    if (!rows || !rows.length) {
      rows = (await hotelsPool.query("SELECT * FROM hotels WHERE slug = ?", [slugOrId]))[0];
    }
    if (!rows || !rows.length) return res.redirect("/hotels");
    const hotel = rows[0];
    let imageUrls = [];
    if (hotel.image_url) imageUrls.push(hotel.image_url);
    if (hotel.image_urls != null) {
      try {
        const parsed = typeof hotel.image_urls === "string" ? JSON.parse(hotel.image_urls) : hotel.image_urls;
        if (Array.isArray(parsed)) {
          parsed.forEach((u) => {
            if (u && !imageUrls.includes(u)) imageUrls.push(u);
          });
        }
      } catch (_err) {
        // keep fallback from image_url above
      }
    }
    if (!imageUrls.length) imageUrls = [FALLBACK_HOTEL_IMAGE];
    imageUrls = imageUrls.filter(Boolean).map(normalizeImageUrl).filter(Boolean);
    if (!imageUrls.length) imageUrls = [FALLBACK_HOTEL_IMAGE];
    hotel.image_urls = imageUrls;
    hotel.image_url = imageUrls[0];

    const locale = req.locale || PRIMARY_LOCALE;
    const [amenRows] = await hotelsPool.query("SELECT amenity_key FROM hotel_amenities WHERE hotel_id = ?", [hotel.id]);
    const amenitiesKeys = Array.isArray(amenRows) ? amenRows.map((r) => r.amenity_key) : [];
    const amenitiesLabels = labelsForAmenityKeys(amenitiesKeys, locale);

    const hotelLoc = applyRowLocale(hotel, locale);
    const [relatedRows] = await hotelsPool.query(
      "SELECT id, name, slug, location, price, image_url, i18n FROM hotels WHERE id != ? ORDER BY id LIMIT 5",
      [hotel.id]
    );
    const relatedHotels = (relatedRows || []).map((r) =>
      applyRowLocale(
        {
          ...r,
          image_url: r.image_url ? normalizeImageUrl(r.image_url) : FALLBACK_HOTEL_IMAGE
        },
        locale
      )
    );

    const [roomRows] = await hotelsPool.query(
      "SELECT id, name, price, image_urls, sort_order, i18n FROM hotel_rooms WHERE hotel_id = ? ORDER BY sort_order ASC, id ASC",
      [hotel.id]
    );
    const hotelRooms = (roomRows || []).map((r) => {
      let urls = [];
      if (r.image_urls != null) {
        try {
          urls = typeof r.image_urls === "string" ? JSON.parse(r.image_urls) : r.image_urls;
          if (!Array.isArray(urls)) urls = [];
        } catch (_err) {
          urls = [];
        }
      }
      const room = { name: r.name, price: r.price, image_urls: urls.filter(Boolean), i18n: r.i18n };
      return applyRoomLocale(room, locale);
    });

    const [reviewRows] = await hotelsPool.query(
      "SELECT id, author_name, rating, text, created_at FROM hotel_reviews WHERE hotel_id = ? ORDER BY created_at DESC",
      [hotel.id]
    );
    const reviewDateTag = locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-RU";
    const reviews = (reviewRows || []).map((r) => ({
      ...r,
      created_at: r.created_at
        ? new Date(r.created_at).toLocaleDateString(reviewDateTag, { day: "numeric", month: "long", year: "numeric" })
        : ""
    }));
    const withRating = (reviewRows || []).filter((r) => r.rating != null);
    const avgRating = withRating.length
      ? Math.round((withRating.reduce((sum, r) => sum + Number(r.rating), 0) / withRating.length) * 10) / 10
      : null;
    const reviewCount = (reviewRows || []).length;

    res.render(path.join(hotelsViewsDir, "hotel.ejs"), {
      hotel: { ...hotelLoc, amenitiesLabels, avgRating, reviewCount, rooms: hotelRooms },
      relatedHotels,
      reviews,
      basePath: publicBasePath,
      lang: locale,
      themeBase: hotelsThemeBase,
      hotelsDetail: getHotelsDetail(locale)
    });
  } catch (err) {
    res.redirect("/hotels");
  }
});

app.post("/api/reviews", async (req, res) => {
  try {
    const body = req.body || {};
    const hotelId = body.hotel_id != null ? parseInt(body.hotel_id, 10) : NaN;
    const name = body.author_name ? String(body.author_name).trim() : "";
    const reviewText = body.text ? String(body.text).trim() : "";
    if (!hotelId || Number.isNaN(hotelId)) {
      return res.status(400).json({ error: "Не указана гостиница. Обновите страницу и попробуйте снова." });
    }
    if (!name) return res.status(400).json({ error: "Укажите ваше имя." });
    if (!reviewText) return res.status(400).json({ error: "Напишите текст отзыва." });
    const ratingVal =
      body.rating != null && body.rating !== ""
        ? Math.min(5, Math.max(1, parseInt(body.rating, 10)))
        : null;
    await hotelsPool.query(
      "INSERT INTO hotel_reviews (hotel_id, author_name, rating, text) VALUES (?, ?, ?, ?)",
      [hotelId, name, ratingVal, reviewText]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Ошибка сохранения отзыва. Попробуйте позже." });
  }
});

// Site (DLE migration) routes.
app.use("/", siteRoutes);

app.use((req, res) => {
  res.status(404).render("404");
});

app.use(errorHandler);

module.exports = app;
