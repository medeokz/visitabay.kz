const adminPostService = require("../services/adminPostService");
const adminCategoryService = require("../services/adminCategoryService");
const adminSettingsService = require("../services/adminSettingsService");
const eventsSemeyService = require("../services/eventsSemeyService");
const tour3dService = require("../services/tour3dService");
const dleContentService = require("../services/dleContentService");

async function computeTour3dPosterPreviewUrl(row) {
  if (!row) return "";
  let u = tour3dService.posterPublicUrl(row.poster);
  if (u) return u;
  let post = null;
  if (Number(row.sort_order) > 0) {
    post = await dleContentService.getPostById(row.sort_order);
  }
  u = tour3dService.posterPublicUrl(dleContentService.firstCoverFromPost(post));
  if (u) return u;
  if (row.legacy_html) {
    post = await dleContentService.getPostByTour3dHtml(String(row.legacy_html).trim());
    u = tour3dService.posterPublicUrl(dleContentService.firstCoverFromPost(post));
    if (u) return u;
  }
  return "";
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

function parseImageFieldValue(v) {
  return String(v || "").split("|")[0].trim();
}

function parseGalleryFieldValue(v) {
  return String(v || "")
    .split(",")
    .map((item) => parseImageFieldValue(item))
    .filter(Boolean);
}

function serializeXfields(fields) {
  return Object.entries(fields)
    .filter(([, value]) => String(value || "").trim() !== "")
    .map(([key, value]) => `${key}|${encodeXfieldsValue(value)}`)
    .join("||");
}

function buildPostBodyFromRequest(body, uploadedImages = {}) {
  const rawXfields = String(body.xfields || "");
  const parsed = parseXfields(rawXfields);
  const uploadedPoster = String(uploadedImages.poster || "").trim();
  const uploadedGallery = Array.isArray(uploadedImages.gallery) ? uploadedImages.gallery : [];

  const posterFromInput = parseImageFieldValue(body.xf_poster || parsed.poster || "");
  const oldGallery = parseGalleryFieldValue(body.xf_gallery || parsed.gallery || "");
  // Важно для UX: на сайте в hero/галерее показываются только первые 2-4 картинки.
  // Поэтому новые загруженные изображения должны идти первыми, иначе пользователь
  // добавил новые файлы, но не видит их в первую очередь.
  const uploadedClean = uploadedGallery.map((x) => String(x || "").trim()).filter(Boolean);
  const mergedGallery = [...uploadedClean, ...oldGallery];

  const friendly = {
    poster: uploadedPoster || posterFromInput,
    gallery: mergedGallery.join(","),
    price: String(body.xf_price || parsed.price || "").trim(),
    location: String(body.xf_location || parsed.location || "").trim(),
    tel: String(body.xf_tel || parsed.tel || "").trim(),
    address: String(body.xf_address || parsed.address || "").trim(),
    site: String(body.xf_site || parsed.site || "").trim(),
    contactfullstory: String(body.xf_contactfullstory || parsed.contactfullstory || "").trim(),
    linkmap: String(body.xf_linkmap || parsed.linkmap || "").trim(),
    mapfull: String(body.xf_mapfull || parsed.mapfull || "").trim(),
    title_kk: String(body.title_kk || parsed.title_kk || "").trim(),
    title_ru: String(body.title_ru || parsed.title_ru || "").trim(),
    title_en: String(body.title_en || parsed.title_en || "").trim(),
    short_story_kk: String(body.short_story_kk || parsed.short_story_kk || ""),
    short_story_ru: String(body.short_story_ru || parsed.short_story_ru || ""),
    short_story_en: String(body.short_story_en || parsed.short_story_en || ""),
    full_story_kk: String(body.full_story_kk || parsed.full_story_kk || ""),
    full_story_ru: String(body.full_story_ru || parsed.full_story_ru || ""),
    full_story_en: String(body.full_story_en || parsed.full_story_en || ""),
    descr_kk: String(body.descr_kk || parsed.descr_kk || "").trim(),
    descr_ru: String(body.descr_ru || parsed.descr_ru || "").trim(),
    descr_en: String(body.descr_en || parsed.descr_en || "").trim(),
    metatitle_kk: String(body.metatitle_kk || parsed.metatitle_kk || "").trim(),
    metatitle_ru: String(body.metatitle_ru || parsed.metatitle_ru || "").trim(),
    metatitle_en: String(body.metatitle_en || parsed.metatitle_en || "").trim()
  };
  const nextXfields = serializeXfields({ ...parsed, ...friendly });
  return {
    title: String(body.title || "").trim(),
    alt_name: String(body.alt_name || "").trim(),
    short_story: String(body.short_story || ""),
    full_story: String(body.full_story || ""),
    xfields: nextXfields,
    category: String(body.category || "0"),
    tags: String(body.tags || ""),
    metatitle: String(body.metatitle || ""),
    descr: String(body.descr || ""),
    keywords: String(body.keywords || ""),
    autor: String(body.autor || "admin").trim(),
    approve: body.approve === "1" || body.approve === "on",
    allow_main: body.allow_main === "1" || body.allow_main === "on",
    xf_poster: friendly.poster,
    xf_gallery: friendly.gallery,
    xf_price: friendly.price,
    xf_location: friendly.location,
    xf_tel: friendly.tel,
    xf_address: friendly.address,
    xf_site: friendly.site,
    xf_contactfullstory: friendly.contactfullstory,
    xf_linkmap: friendly.linkmap,
    xf_mapfull: friendly.mapfull,
    title_kk: friendly.title_kk,
    title_ru: friendly.title_ru,
    title_en: friendly.title_en,
    short_story_kk: friendly.short_story_kk,
    short_story_ru: friendly.short_story_ru,
    short_story_en: friendly.short_story_en,
    full_story_kk: friendly.full_story_kk,
    full_story_ru: friendly.full_story_ru,
    full_story_en: friendly.full_story_en,
    descr_kk: friendly.descr_kk,
    descr_ru: friendly.descr_ru,
    descr_en: friendly.descr_en,
    metatitle_kk: friendly.metatitle_kk,
    metatitle_ru: friendly.metatitle_ru,
    metatitle_en: friendly.metatitle_en
  };
}

function withFriendlyXfields(post) {
  if (!post) return post;
  const parsed = parseXfields(post.xfields || "");
  return {
    ...post,
    xf_poster: parseImageFieldValue(parsed.poster || ""),
    xf_gallery: parseGalleryFieldValue(parsed.gallery || "").join(","),
    xf_price: parsed.price || "",
    xf_location: parsed.location || "",
    xf_tel: parsed.tel || "",
    xf_address: parsed.address || "",
    xf_site: parsed.site || "",
    xf_contactfullstory: parsed.contactfullstory || "",
    xf_linkmap: parsed.linkmap || "",
    xf_mapfull: parsed.mapfull || "",
    title_kk: parsed.title_kk || "",
    title_ru: parsed.title_ru || "",
    title_en: parsed.title_en || "",
    short_story_kk: parsed.short_story_kk || "",
    short_story_ru: parsed.short_story_ru || "",
    short_story_en: parsed.short_story_en || "",
    full_story_kk: parsed.full_story_kk || "",
    full_story_ru: parsed.full_story_ru || "",
    full_story_en: parsed.full_story_en || "",
    descr_kk: parsed.descr_kk || "",
    descr_ru: parsed.descr_ru || "",
    descr_en: parsed.descr_en || "",
    metatitle_kk: parsed.metatitle_kk || "",
    metatitle_ru: parsed.metatitle_ru || "",
    metatitle_en: parsed.metatitle_en || ""
  };
}

function uploadsUrlFromRel(rel) {
  const r = String(rel || "").trim();
  if (!r) return "";
  if (/^https?:\/\//i.test(r)) return r;
  // rel from uploadsRoot: "posts/2026-03/xxx.jpg" or "files/2026-03/xxx.mp4"
  return r.startsWith("/uploads/") ? r : `/uploads/${r.replace(/^\/+/, "")}`;
}

function appendVideoToFullStory(fullStory, videoRelPath) {
  const src = uploadsUrlFromRel(videoRelPath);
  if (!src) return fullStory;
  const html = String(fullStory || "");
  if (html.includes(src)) return html; // идемпотентно
  const tag = `<p><video controls preload="metadata" style="max-width:100%;height:auto;" src="${src}"></video></p>`;
  return html ? `${html}\n${tag}` : tag;
}

function categoryI18nPayload(body) {
  function trimFields(o) {
    const out = {};
    Object.keys(o).forEach((k) => {
      const v = o[k];
      if (v != null && String(v).trim()) out[k] = String(v).trim();
    });
    return out;
  }
  const ru = trimFields({
    name: body.name_ru,
    descr: body.descr_ru,
    fulldescr: body.fulldescr_ru,
    metatitle: body.metatitle_ru
  });
  const en = trimFields({
    name: body.name_en,
    descr: body.descr_en,
    fulldescr: body.fulldescr_en,
    metatitle: body.metatitle_en
  });
  const i18n = {};
  if (Object.keys(ru).length) i18n.ru = ru;
  if (Object.keys(en).length) i18n.en = en;
  return Object.keys(i18n).length ? JSON.stringify(i18n) : null;
}

function mapCategoryBody(body) {
  return {
    name: String(body.name || "").trim(),
    alt_name: String(body.alt_name || "").trim(),
    parentid: Number(body.parentid) || 0,
    posi: Number(body.posi) || 1,
    descr: String(body.descr || ""),
    fulldescr: String(body.fulldescr || ""),
    metatitle: String(body.metatitle || ""),
    keywords: String(body.keywords || ""),
    active: body.active === "1" || body.active === "on",
    i18n: categoryI18nPayload(body || {})
  };
}

function mapSettingsBody(body) {
  return {
    siteName: String(body.siteName || "").trim(),
    siteUrl: String(body.siteUrl || "").trim(),
    adminEmail: String(body.adminEmail || "").trim(),
    postsPerPage: Number(body.postsPerPage) || 20,
    maintenanceMode: body.maintenanceMode === "1" || body.maintenanceMode === "on"
  };
}

async function dashboard(req, res, next) {
  try {
    const [posts, categories, settings] = await Promise.all([
      adminPostService.listPosts(10),
      adminCategoryService.listCategories(),
      adminSettingsService.getSettings()
    ]);
    res.render("admin/dashboard", {
      section: "dashboard",
      stats: {
        posts: posts.length,
        categories: categories.length
      },
      settings
    });
  } catch (err) {
    next(err);
  }
}

async function eventsSemeyAdmin(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const posts = await eventsSemeyService.listAdmin({ limit: 500, q });
    res.render("admin/events/index", {
      section: "events",
      posts,
      filters: { q },
      success: String(req.query.success || "").trim()
    });
  } catch (err) {
    next(err);
  }
}

async function eventsSemeyCreateForm(req, res, next) {
  try {
    res.render("admin/events/form", {
      section: "events",
      mode: "create",
      event: null,
      success: String(req.query.success || "").trim()
    });
  } catch (err) {
    next(err);
  }
}

async function eventsSemeyCreate(req, res, next) {
  try {
    const body = {
      ...(req.body || {}),
      poster_url:
        (req.uploadedImages && req.uploadedImages.poster) ||
        String((req.body && req.body.poster_url) || "").trim()
    };
    const id = await eventsSemeyService.createFromBody(body);
    return res.redirect(`/admin/events/${id}/edit?success=created`);
  } catch (err) {
    if (String(err && err.message) === "TITLE_REQUIRED") {
      return res.status(400).render("admin/events/form", {
        section: "events",
        mode: "create",
        event: {
          ...(req.body || {}),
          poster_url:
            (req.uploadedImages && req.uploadedImages.poster) ||
            String((req.body && req.body.poster_url) || "").trim()
        },
        error: "Название события обязательно."
      });
    }
    next(err);
  }
}

async function eventsSemeyEditForm(req, res, next) {
  try {
    const id = Number(req.params.id);
    const event = await eventsSemeyService.getById(id);
    if (!event) return res.status(404).render("404");
    return res.render("admin/events/form", {
      section: "events",
      mode: "edit",
      event,
      success: String(req.query.success || "").trim()
    });
  } catch (err) {
    next(err);
  }
}

async function eventsSemeyUpdate(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await eventsSemeyService.getById(id);
    if (!existing) return res.status(404).render("404");

    const rawBody = req.body || {};
    const resolvedTitle =
      String(rawBody.title || "").trim() ||
      String(rawBody.title_backup || "").trim() ||
      String(existing.title || "").trim();
    const body = {
      ...rawBody,
      title: resolvedTitle,
      poster_url:
        (req.uploadedImages && req.uploadedImages.poster) ||
        String((rawBody && rawBody.poster_url) || "").trim() ||
        String(existing.poster_url || "").trim()
    };
    await eventsSemeyService.updateFromBody(id, body);
    return res.redirect(`/admin/events/${id}/edit?success=saved`);
  } catch (err) {
    if (String(err && err.message) === "TITLE_REQUIRED") {
      return res.status(400).render("admin/events/form", {
        section: "events",
        mode: "edit",
        event: {
          ...(req.body || {}),
          id: Number(req.params.id),
          poster_url:
            (req.uploadedImages && req.uploadedImages.poster) ||
            String((req.body && req.body.poster_url) || "").trim()
        },
        error: "Название события обязательно."
      });
    }
    next(err);
  }
}

async function eventsSemeyDelete(req, res, next) {
  try {
    await eventsSemeyService.remove(Number(req.params.id));
    return res.redirect("/admin/events?success=deleted");
  } catch (err) {
    next(err);
  }
}

async function posts(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const categoryId = Number(req.query.category) || 0;
    const [posts, categories] = await Promise.all([
      adminPostService.listPosts({ limit: 500, q, categoryId }),
      adminPostService.getCategories()
    ]);
    res.render("admin/posts/index", {
      section: "posts",
      posts,
      categories,
      filters: { q, categoryId }
    });
  } catch (err) {
    next(err);
  }
}

async function tours3dList(req, res, next) {
  try {
    const tours = await tour3dService.listAllAdmin();
    res.render("admin/3d/index", { section: "d3d", tours });
  } catch (err) {
    next(err);
  }
}

async function tours3dCreateForm(req, res, next) {
  try {
    res.render("admin/3d/form", { section: "d3d", mode: "create", tour: null });
  } catch (err) {
    next(err);
  }
}

async function tours3dCreate(req, res, next) {
  try {
    const b = tour3dService.bodyFromRequest(req.body);
    if (req.uploadedTour3dPoster) b.poster = req.uploadedTour3dPoster;
    if (!b.title || !tour3dService.isTourEmbedUrl(b.matterport_url)) {
      return res.status(400).render("admin/3d/form", {
        section: "d3d",
        mode: "create",
        tour: { ...b, is_published: b.is_published },
        error: "Укажите заголовок и ссылку на тур: Matterport (https://my.matterport.com/…) или Treedis (https://my.treedis.com/tour/…)."
      });
    }
    if (b.legacy_html && (await tour3dService.isLegacyHtmlTaken(b.legacy_html))) {
      return res.status(400).render("admin/3d/form", {
        section: "d3d",
        mode: "create",
        tour: { ...b, is_published: b.is_published },
        error: "Такой URL файла уже занят другим туром."
      });
    }
    await tour3dService.create(b);
    return res.redirect("/admin/3d");
  } catch (err) {
    next(err);
  }
}

async function tours3dEditForm(req, res, next) {
  try {
    const id = Number(req.params.id);
    const row = await tour3dService.getById(id);
    if (!row) return res.status(404).render("404");
    const posterPreviewUrl = await computeTour3dPosterPreviewUrl(row);
    res.render("admin/3d/form", { section: "d3d", mode: "edit", tour: row, posterPreviewUrl });
  } catch (err) {
    next(err);
  }
}

async function tours3dUpdate(req, res, next) {
  try {
    const id = Number(req.params.id);
    const row = await tour3dService.getById(id);
    if (!row) return res.status(404).render("404");
    const b = tour3dService.bodyFromRequest(req.body);
    if (req.uploadedTour3dPoster) {
      b.poster = req.uploadedTour3dPoster;
    } else if (!String(req.body.poster || "").trim()) {
      b.poster = row.poster || "";
    }
    if (!b.title || !tour3dService.isTourEmbedUrl(b.matterport_url)) {
      const merged = { ...row, ...b, id };
      const posterPreviewUrl = await computeTour3dPosterPreviewUrl(merged);
      return res.status(400).render("admin/3d/form", {
        section: "d3d",
        mode: "edit",
        tour: merged,
        posterPreviewUrl,
        error: "Укажите заголовок и ссылку на тур: Matterport (https://my.matterport.com/…) или Treedis (https://my.treedis.com/tour/…)."
      });
    }
    if (b.legacy_html && (await tour3dService.isLegacyHtmlTaken(b.legacy_html, id))) {
      const merged = { ...row, ...b, id };
      const posterPreviewUrl = await computeTour3dPosterPreviewUrl(merged);
      return res.status(400).render("admin/3d/form", {
        section: "d3d",
        mode: "edit",
        tour: merged,
        posterPreviewUrl,
        error: "Такой URL файла уже занят другим туром."
      });
    }
    await tour3dService.update(id, b);
    return res.redirect("/admin/3d");
  } catch (err) {
    next(err);
  }
}

async function tours3dDelete(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id || id < 1) return res.status(404).render("404");
    const row = await tour3dService.getById(id);
    if (!row) return res.status(404).render("404");
    await tour3dService.remove(id);
    return res.redirect("/admin/3d");
  } catch (err) {
    next(err);
  }
}

async function postCreateForm(req, res, next) {
  try {
    const categories = await adminPostService.getCategories();
    const presetCat = Number(req.query.category) || 0;
    const post = presetCat > 0 ? { category: String(presetCat) } : null;
    res.render("admin/posts/form", {
      section: "posts",
      mode: "create",
      post,
      categories
    });
  } catch (err) {
    next(err);
  }
}

async function postCreate(req, res, next) {
  try {
    const body = buildPostBodyFromRequest(req.body, req.uploadedImages);
    if (!body.title) {
      const categories = await adminPostService.getCategories();
      return res.status(400).render("admin/posts/form", {
        section: "posts",
        mode: "create",
        post: body,
        categories,
        error: "Заголовок обязателен."
      });
    }
    if (req.uploadedFullStoryVideos && Array.isArray(req.uploadedFullStoryVideos) && req.uploadedFullStoryVideos.length) {
      for (const videoRel of req.uploadedFullStoryVideos) {
        body.full_story = appendVideoToFullStory(body.full_story, videoRel);
      }
    }
    const id = await adminPostService.createPost(body);
    return res.redirect(`/admin/posts/${id}/edit`);
  } catch (err) {
    next(err);
  }
}

async function postEditForm(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [post, categories] = await Promise.all([
      adminPostService.getPostById(id),
      adminPostService.getCategories()
    ]);
    if (!post) return res.status(404).render("404");
    return res.render("admin/posts/form", {
      section: "posts",
      mode: "edit",
      post: withFriendlyXfields(post),
      categories
    });
  } catch (err) {
    next(err);
  }
}

async function postUpdate(req, res, next) {
  try {
    const id = Number(req.params.id);
    const body = buildPostBodyFromRequest(req.body, req.uploadedImages);
    if (!body.title) {
      const categories = await adminPostService.getCategories();
      return res.status(400).render("admin/posts/form", {
        section: "posts",
        mode: "edit",
        post: { ...body, id },
        categories,
        error: "Заголовок обязателен."
      });
    }
    if (req.uploadedFullStoryVideos && Array.isArray(req.uploadedFullStoryVideos) && req.uploadedFullStoryVideos.length) {
      for (const videoRel of req.uploadedFullStoryVideos) {
        body.full_story = appendVideoToFullStory(body.full_story, videoRel);
      }
    }
    await adminPostService.updatePost(id, body);
    return res.redirect(`/admin/posts/${id}/edit`);
  } catch (err) {
    next(err);
  }
}

async function postDelete(req, res, next) {
  try {
    await adminPostService.deletePost(Number(req.params.id));
    return res.redirect("/admin/posts");
  } catch (err) {
    next(err);
  }
}

async function categories(req, res, next) {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const categoriesAll = await adminCategoryService.listCategories();
    const categories = q
      ? categoriesAll.filter((c) => {
          const name = String(c.name || "").toLowerCase();
          const slug = String(c.alt_name || "").toLowerCase();
          return name.includes(q) || slug.includes(q);
        })
      : categoriesAll;
    res.render("admin/categories/index", { section: "categories", categories, filters: { q } });
  } catch (err) {
    next(err);
  }
}

async function categoryCreateForm(req, res, next) {
  try {
    const categories = await adminCategoryService.listCategories();
    res.render("admin/categories/form", {
      section: "categories",
      mode: "create",
      category: null,
      categories
    });
  } catch (err) {
    next(err);
  }
}

async function categoryCreate(req, res, next) {
  try {
    const payload = mapCategoryBody(req.body);
    if (!payload.name) {
      const categories = await adminCategoryService.listCategories();
      return res.status(400).render("admin/categories/form", {
        section: "categories",
        mode: "create",
        category: payload,
        categories,
        error: "Название категории обязательно."
      });
    }
    const id = await adminCategoryService.createCategory(payload);
    return res.redirect(`/admin/categories/${id}/edit`);
  } catch (err) {
    next(err);
  }
}

async function categoryEditForm(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [category, categories] = await Promise.all([
      adminCategoryService.getCategoryById(id),
      adminCategoryService.listCategories()
    ]);
    if (!category) return res.status(404).render("404");
    res.render("admin/categories/form", {
      section: "categories",
      mode: "edit",
      category,
      categories
    });
  } catch (err) {
    next(err);
  }
}

async function categoryUpdate(req, res, next) {
  try {
    const id = Number(req.params.id);
    const payload = mapCategoryBody(req.body);
    if (!payload.name) {
      const categories = await adminCategoryService.listCategories();
      return res.status(400).render("admin/categories/form", {
        section: "categories",
        mode: "edit",
        category: { ...payload, id },
        categories,
        error: "Название категории обязательно."
      });
    }
    await adminCategoryService.updateCategory(id, payload);
    return res.redirect(`/admin/categories/${id}/edit`);
  } catch (err) {
    next(err);
  }
}

async function categoryDelete(req, res, next) {
  try {
    await adminCategoryService.deleteCategory(Number(req.params.id));
    return res.redirect("/admin/categories");
  } catch (err) {
    next(err);
  }
}

async function settingsForm(req, res, next) {
  try {
    const settings = await adminSettingsService.getSettings();
    res.render("admin/settings", { section: "settings", settings });
  } catch (err) {
    next(err);
  }
}

async function settingsSave(req, res, next) {
  try {
    const saved = await adminSettingsService.saveSettings(mapSettingsBody(req.body));
    res.render("admin/settings", { section: "settings", settings: saved, success: "Настройки сохранены." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  dashboard,
  eventsSemeyAdmin,
  eventsSemeyCreateForm,
  eventsSemeyCreate,
  eventsSemeyEditForm,
  eventsSemeyUpdate,
  eventsSemeyDelete,
  posts,
  tours3dList,
  tours3dCreateForm,
  tours3dCreate,
  tours3dEditForm,
  tours3dUpdate,
  tours3dDelete,
  postCreateForm,
  postCreate,
  postEditForm,
  postUpdate,
  postDelete,
  categories,
  categoryCreateForm,
  categoryCreate,
  categoryEditForm,
  categoryUpdate,
  categoryDelete,
  settingsForm,
  settingsSave
};
