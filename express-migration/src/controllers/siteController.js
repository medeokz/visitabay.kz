const dleContentService = require("../services/dleContentService");
const tour3dService = require("../services/tour3dService");
const hotelsPool = require("../../../hotels/config/db");
const hotelsCatalogService = require("../services/hotelsCatalogService");
const eventsSemeyService = require("../services/eventsSemeyService");
const {
  EVENTS_SEMEY_PUBLIC_PATH,
  CATEGORY_3D_SLUG
} = require("../config/contentSections");
const { PRIMARY_LOCALE } = require("../../../hotels/utils/i18n");
const { publicBasePath } = require("../config/env");

function publicUrl(relPath) {
  const p = relPath.startsWith("/") ? relPath : `/${relPath}`;
  return `${publicBasePath || ""}${p}`;
}

function toLocalDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const src = String(value).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(src);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function plusDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function matchesEventsPeriod(eventDateRaw, period) {
  const eventDate = toLocalDateOnly(eventDateRaw);
  if (!eventDate) return false;
  const today = toLocalDateOnly(new Date());
  if (!today) return false;
  if (period === "today") {
    return eventDate.getTime() === today.getTime();
  }
  if (period === "tomorrow") {
    return eventDate.getTime() === plusDays(today, 1).getTime();
  }
  if (period === "weekend") {
    const maxDate = plusDays(today, 7);
    const day = eventDate.getDay();
    return eventDate >= today && eventDate <= maxDate && (day === 0 || day === 6);
  }
  return true;
}

function formatIsoDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function localeToBcp47(loc) {
  const l = String(loc || PRIMARY_LOCALE).toLowerCase();
  if (l === "kk") return "kk-KZ";
  if (l === "en") return "en-US";
  return "ru-RU";
}

function buildDateFilterItems(daysForward = 66, locale = "ru") {
  const tag = localeToBcp47(locale);
  const items = [];
  const start = toLocalDateOnly(new Date());
  if (!start) return items;
  for (let i = 0; i < daysForward; i += 1) {
    const dt = plusDays(start, i);
    items.push({
      iso: formatIsoDateLocal(dt),
      day: dt.getDate(),
      month: dt.getMonth(),
      monthLabel: dt.toLocaleDateString(tag, { month: "long" }),
      weekdayLabel: dt.toLocaleDateString(tag, { weekday: "short" })
    });
  }
  return items;
}

async function home(req, res, next) {
  try {
    const loc = req.locale || PRIMARY_LOCALE;
    const locPost = (p) => dleContentService.applyPostLocale(p, loc);
    const byLoc = (arr) => dleContentService.filterPostsByLocale(arr || [], loc);
    const [popularPostsRaw, legends, beach, eco, hotelsCatalog, events] = await Promise.all([
      dleContentService.getPostsByCategoryId(9, 6),
      dleContentService.getPostsByCategorySlug("legend-mif", 6),
      dleContentService.getPostsByCategorySlug("pljazhnyi-turizm", 6),
      dleContentService.getPostsByCategorySlug("jekoturizm", 3),
      hotelsCatalogService.listForPostPage(6, loc),
      eventsSemeyService.listPublic(60)
    ]);

    const popularPosts = byLoc(popularPostsRaw).map(locPost);
    const eventPosts = (events || []).map((e) => eventsSemeyService.applyEventLocale(e, loc));

    res.render("index", {
      popularPosts,
      legendPosts: byLoc(legends.posts).map(locPost),
      beachPosts: byLoc(beach.posts).map(locPost),
      ecoPosts: byLoc(eco.posts).map(locPost),
      hotelPosts: hotelsCatalog,
      eventPosts
    });
  } catch (err) {
    next(err);
  }
}

async function eventsSemeyPage(req, res, next) {
  try {
    const loc = req.locale || PRIMARY_LOCALE;
    const periodRaw = String(req.query.period || "").trim().toLowerCase();
    const period = ["today", "tomorrow", "weekend"].includes(periodRaw) ? periodRaw : "";
    const selectedDateRaw = String(req.query.date || "").trim();
    const selectedDate = toLocalDateOnly(selectedDateRaw);
    const allEventsRaw = await eventsSemeyService.listPublic(500);
    const allEvents = (allEventsRaw || []).map((e) => eventsSemeyService.applyEventLocale(e, loc));
    let events = allEvents;
    if (selectedDate) {
      events = allEvents.filter((e) => {
        const d = toLocalDateOnly(e.event_date);
        return d && d.getTime() === selectedDate.getTime();
      });
    } else if (period) {
      events = allEvents.filter((e) => matchesEventsPeriod(e.event_date, period));
    }

    const dateFilterItems = buildDateFilterItems(66, loc);
    res.render("events-semey", {
      events,
      period,
      selectedDate: selectedDate ? formatIsoDateLocal(selectedDate) : "",
      dateFilterItems,
      lang: loc,
      dateLocale: localeToBcp47(loc)
    });
  } catch (err) {
    next(err);
  }
}

async function eventsSemeyBySlug(req, res, next) {
  try {
    const loc = req.locale || PRIMARY_LOCALE;
    const [eventRaw, allEventsRaw] = await Promise.all([
      eventsSemeyService.getBySlug(req.params.slug),
      eventsSemeyService.listPublic(12)
    ]);
    if (!eventRaw) return res.status(404).render("404");
    const event = eventsSemeyService.applyEventLocale(eventRaw, loc);
    const recommendedEvents = (allEventsRaw || [])
      .map((e) => eventsSemeyService.applyEventLocale(e, loc))
      .filter((e) => e && e.slug && e.slug !== event.slug)
      .slice(0, 6);
    res.render("events-semey-item", {
      event,
      recommendedEvents,
      lang: loc,
      dateLocale: localeToBcp47(loc)
    });
  } catch (err) {
    next(err);
  }
}

async function renderPostBySlug(req, res, next, slug) {
  try {
    const loc = req.locale || PRIMARY_LOCALE;
    const postRaw = await dleContentService.getPostByAltName(slug);
    if (!postRaw) return res.status(404).render("404");
    if (!dleContentService.hasLocaleContent(postRaw, loc)) return res.status(404).render("404");
    const post = dleContentService.applyPostLocale(postRaw, loc);
    const categoryIds = String(post.category || "")
      .split(",")
      .map((x) => parseInt(x, 10))
      .filter((x) => Number.isInteger(x) && x > 0);

    let postKind = "default";
    if (categoryIds.includes(24)) postKind = "hotel";
    if (categoryIds.includes(31) || categoryIds.includes(32)) postKind = "alakol";

    const relatedPostsRaw = await dleContentService.getRelatedPostsNearest(postRaw, 6);
    const relatedPosts = dleContentService
      .filterPostsByLocale(relatedPostsRaw || [], loc)
      .map((p) => dleContentService.applyPostLocale(p, loc));
    const [whereToStayPostsRaw, catalogHotels] = await Promise.all([
      dleContentService.getPostsByCategoryId(24, 6),
      hotelsCatalogService.listForPostPage(8, loc)
    ]);
    const whereToStayPosts = dleContentService
      .filterPostsByLocale(whereToStayPostsRaw || [], loc)
      .map((p) => dleContentService.applyPostLocale(p, loc));
    res.render("post", { post, postKind, relatedPosts, whereToStayPosts, catalogHotels });
  } catch (err) {
    next(err);
  }
}

/** Как в post.ejs: постер + до двух кадров из галереи без дубликата обложки */
function buildTour3dSlides(posterUrl, galleryArr) {
  const g = (Array.isArray(galleryArr) ? galleryArr : []).map((x) => String(x || "").trim()).filter(Boolean);
  const posterHero = String(posterUrl || "").trim();
  const heroSlides = [];
  if (posterHero) {
    heroSlides.push(posterHero);
  } else if (g.length) {
    heroSlides.push(g[0]);
  }
  const coverUrl = heroSlides[0] || "";
  let fromGal = 0;
  for (let gi = 0; gi < g.length && fromGal < 2; gi++) {
    const u = g[gi];
    if (!u || u === coverUrl) continue;
    heroSlides.push(u);
    fromGal++;
  }
  return heroSlides;
}

async function tour3dPage(req, res, next) {
  try {
    const file = String(req.params.legacyHtml || "").trim();
    if (!file || !/\.html$/i.test(file)) return next();
    const loc = req.locale || PRIMARY_LOCALE;

    const viewTour = await tour3dService.getPublishedByLegacyHtml(file);
    if (viewTour && viewTour.matterport_ok) {
      let slides = buildTour3dSlides(viewTour.poster, []);
      const storyHtml = viewTour.full_story || viewTour.short_story || "";

      let postRaw = await dleContentService.getPostByTour3dHtml(file);
      if (!postRaw && viewTour.sort_order > 0) {
        const byId = await dleContentService.getPostById(viewTour.sort_order);
        const cat3d = await dleContentService.getCategoryByAltName(CATEGORY_3D_SLUG);
        if (byId && cat3d) {
          const cats = String(byId.category || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          if (cats.includes(String(cat3d.id))) postRaw = byId;
        }
      }
      if (postRaw && dleContentService.hasLocaleContent(postRaw, loc)) {
        const post = dleContentService.applyPostLocale(postRaw, loc);
        const poster = post.poster || viewTour.poster;
        const gallery = post.gallery || [];
        slides = buildTour3dSlides(poster, gallery);
      }

      return res.render("tour3d-fullstory", {
        pageTitle: viewTour.title,
        matterportSrc: viewTour.matterport_url,
        slides,
        storyHtml
      });
    }

    const postRaw = await dleContentService.getPostByTour3dHtml(file);
    if (!postRaw) return res.status(404).render("404");
    if (!dleContentService.hasLocaleContent(postRaw, loc)) return res.status(404).render("404");
    const post = dleContentService.applyPostLocale(postRaw, loc);
    const xf = post.xfields || {};
    const mp = tour3dService.normalizeMatterportUrl(
      String(xf.tour3d_public_url || xf.iframe || "").trim()
    );
    if (!tour3dService.isTourEmbedUrl(mp)) return renderPostBySlug(req, res, next, post.alt_name);

    const slides = buildTour3dSlides(post.poster, post.gallery || []);
    const storyHtml = post.full_story || post.short_story || "";
    return res.render("tour3d-fullstory", {
      pageTitle: post.title,
      matterportSrc: mp,
      slides,
      storyHtml
    });
  } catch (err) {
    next(err);
  }
}

async function postBySlug(req, res, next) {
  try {
    const slug = String(req.params.slug || "").trim();
    if (!slug) return next();
    if (slug === CATEGORY_3D_SLUG) {
      const cat3d = await dleContentService.getCategoryByAltName(CATEGORY_3D_SLUG);
      if (cat3d) {
        const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
        return res.redirect(301, publicUrl(`/category/${CATEGORY_3D_SLUG}`) + q);
      }
    }
    return renderPostBySlug(req, res, next, slug);
  } catch (err) {
    next(err);
  }
}

/** Если в abay_tour3d нет poster — берём постер или 1-й кадр галереи из связанного поста DLE. */
async function enrichTour3dPostersFromDle(tours, loc) {
  for (const tour of tours || []) {
    if (String(tour.poster || "").trim()) continue;
    let post = null;
    if (Number(tour.sort_order) > 0) {
      post = await dleContentService.getPostById(tour.sort_order);
    }
    let url = dleContentService.firstCoverFromPost(post);
    if (!url && tour.legacy_html) {
      const raw = await dleContentService.getPostByTour3dHtml(String(tour.legacy_html).trim());
      if (raw) {
        post = dleContentService.hasLocaleContent(raw, loc)
          ? dleContentService.applyPostLocale(raw, loc)
          : dleContentService.applyPostLocale(raw, PRIMARY_LOCALE);
        url = dleContentService.firstCoverFromPost(post);
      }
    }
    if (url) tour.poster = tour3dService.posterPublicUrl(url);
  }
}

async function categoryBySlug(req, res, next) {
  try {
    const loc = req.locale || PRIMARY_LOCALE;
    const categoryRaw = await dleContentService.getCategoryByAltName(req.params.slug);
    if (!categoryRaw) return res.status(404).render("404");
    const category = dleContentService.applyCategoryLocale(categoryRaw, loc);
    let postsRaw = [];
    if (category.alt_name !== CATEGORY_3D_SLUG) {
      postsRaw = await dleContentService.getPostsByCategoryId(category.id, 50);
    }
    const posts = dleContentService
      .filterPostsByLocale(postsRaw || [], loc)
      .map((p) => dleContentService.applyPostLocale(p, loc));
    let tours3d = [];
    if (category.alt_name === CATEGORY_3D_SLUG) {
      tours3d = await tour3dService.listPublishedForSite();
      await enrichTour3dPostersFromDle(tours3d, loc);
    }
    let categoryKind = "default";
    if (category.alt_name === "hotels") categoryKind = "hotels";
    if (category.alt_name === "baza-otdyha-alakol") categoryKind = "alakol";
    res.render("category", { category, posts, tours3d, categoryKind });
  } catch (err) {
    next(err);
  }
}

async function staticPage(req, res, next) {
  try {
    const page = await dleContentService.getStaticPageByName(req.params.name);
    if (!page) return res.status(404).render("404");
    res.render("static", { page });
  } catch (err) {
    next(err);
  }
}

async function legacyHtml(req, res, next) {
  try {
    const post = await dleContentService.getPostByLegacyHtmlPath(req.path);
    if (!post) return res.status(404).render("404");
    return renderPostBySlug(req, res, next, post.alt_name);
  } catch (err) {
    next(err);
  }
}

async function legacyStatic(req, res, next) {
  try {
    const name = req.query.page;
    if (!name) return res.status(400).send("Missing page parameter");
    const page = await dleContentService.getStaticPageByName(name);
    if (!page) return res.status(404).render("404");
    return res.redirect(301, publicUrl(`/page/${page.name}`));
  } catch (err) {
    next(err);
  }
}

async function search(req, res, next) {
  try {
    const loc = req.locale || PRIMARY_LOCALE;
    const q = String(req.query.q || "").trim().toLowerCase();
    if (!q) return res.render("search", { q: "", posts: [] });
    const posts = dleContentService.filterPostsByLocale(await dleContentService.getLatestPosts(200), loc);
    const filtered = posts.filter((p) => {
      const ploc = dleContentService.applyPostLocale(p, loc);
      const title = String(ploc.title || "").toLowerCase();
      const story = String(ploc.short_story || "").replace(/<[^>]*>/g, "").toLowerCase();
      return title.includes(q) || story.includes(q);
    });
    const postsOut = filtered.slice(0, 50).map((p) => dleContentService.applyPostLocale(p, loc));
    res.render("search", { q, posts: postsOut });
  } catch (err) {
    next(err);
  }
}

async function robotsTxt(req, res, next) {
  try {
    const body = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin.php",
      "Disallow: /engine/",
      "Sitemap: /sitemap.xml"
    ].join("\n");
    res.type("text/plain").send(body);
  } catch (err) {
    next(err);
  }
}

async function sitemapXml(req, res, next) {
  try {
    const [posts, categories, pages] = await Promise.all([
      dleContentService.getAllPublishedPosts(),
      dleContentService.getAllActiveCategories(),
      dleContentService.getAllStaticPages()
    ]);

    const urls = [];
    const nowIso = new Date().toISOString();
    urls.push({ loc: "/", lastmod: nowIso, changefreq: "daily", priority: "1.0" });
    urls.push({
      loc: EVENTS_SEMEY_PUBLIC_PATH,
      lastmod: nowIso,
      changefreq: "daily",
      priority: "0.85"
    });
    urls.push({
      loc: "/baza-alakol",
      lastmod: nowIso,
      changefreq: "weekly",
      priority: "0.82"
    });
    try {
      const [abRows] = await hotelsPool.query(
        "SELECT slug, id, updated_at FROM alakol_bases WHERE is_published = 1"
      );
      (abRows || []).forEach((row) => {
        const slugPart = row.slug && String(row.slug).trim() ? String(row.slug).trim() : String(row.id);
        const lm = row.updated_at ? new Date(row.updated_at).toISOString() : nowIso;
        urls.push({
          loc: `/baza-alakol/${encodeURIComponent(slugPart)}`,
          lastmod: lm,
          changefreq: "weekly",
          priority: "0.75"
        });
      });
    } catch (_e) {}

    (categories || []).forEach((c) => {
      urls.push({ loc: `/category/${c.alt_name}`, lastmod: nowIso, changefreq: "weekly", priority: "0.8" });
    });
    (pages || []).forEach((p) => {
      const lastmod = p.date ? new Date(Number(p.date) * 1000).toISOString() : nowIso;
      urls.push({ loc: `/page/${p.name}`, lastmod, changefreq: "monthly", priority: "0.6" });
    });
    (posts || []).forEach((p) => {
      if (p.alt_name === CATEGORY_3D_SLUG) return;
      const lastmod = p.date ? new Date(p.date).toISOString() : nowIso;
      urls.push({ loc: `/post/${p.alt_name}`, lastmod, changefreq: "weekly", priority: "0.7" });
    });

    try {
      const legRows = await tour3dService.listLegacySitemapRows();
      (legRows || []).forEach((row) => {
        const lh = String(row.legacy_html || "").trim();
        if (!lh) return;
        const lm = row.updated_at ? new Date(row.updated_at).toISOString() : nowIso;
        urls.push({ loc: `/3d/${lh}`, lastmod: lm, changefreq: "weekly", priority: "0.72" });
      });
    } catch (_e) {}

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      urls.map((u) => {
        return `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`;
      }).join("") +
      `</urlset>`;

    res.type("application/xml").send(xml);
  } catch (err) {
    next(err);
  }
}

async function friendlyCatchAll(req, res, next) {
  try {
    const raw = String(req.path || "").replace(/^\/+|\/+$/g, "");
    if (!raw) return next();

    if (raw === "search") return search(req, res, next);

    if (raw === CATEGORY_3D_SLUG) {
      const cat3d = await dleContentService.getCategoryByAltName(CATEGORY_3D_SLUG);
      if (cat3d) {
        const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
        return res.redirect(301, publicUrl(`/category/${CATEGORY_3D_SLUG}`) + q);
      }
    }

    // 1) Post by short slug (DLE-style /slug/) — без редиректа на /post/...
    const post = await dleContentService.getPostByAltName(raw);
    if (post) return renderPostBySlug(req, res, next, post.alt_name);

    // 2) Try as category slug.
    const category = await dleContentService.getCategoryByAltName(raw);
    if (category) return res.redirect(301, publicUrl(`/category/${category.alt_name}`));

    // 3) Try as static page name.
    const page = await dleContentService.getStaticPageByName(raw);
    if (page) return res.redirect(301, publicUrl(`/page/${page.name}`));

    return next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  home,
  eventsSemeyPage,
  eventsSemeyBySlug,
  tour3dPage,
  postBySlug,
  categoryBySlug,
  staticPage,
  legacyHtml,
  legacyStatic,
  search,
  robotsTxt,
  sitemapXml,
  friendlyCatchAll
};
