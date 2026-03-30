const adminPostService = require("../services/adminPostService");

function normalizeCategory(categoryInput) {
  if (Array.isArray(categoryInput)) return categoryInput.filter(Boolean).join(",");
  return String(categoryInput || "0");
}

function mapFormBody(body) {
  return {
    title: String(body.title || "").trim(),
    alt_name: String(body.alt_name || "").trim(),
    short_story: String(body.short_story || ""),
    full_story: String(body.full_story || ""),
    xfields: String(body.xfields || ""),
    category: normalizeCategory(body.category),
    tags: String(body.tags || ""),
    metatitle: String(body.metatitle || ""),
    descr: String(body.descr || ""),
    keywords: String(body.keywords || ""),
    autor: String(body.autor || "admin").trim(),
    approve: body.approve === "1" || body.approve === "on",
    allow_main: body.allow_main === "1" || body.allow_main === "on"
  };
}

async function index(req, res, next) {
  try {
    const posts = await adminPostService.listPosts(200);
    res.render("admin/posts/index", { posts });
  } catch (err) {
    next(err);
  }
}

async function createForm(req, res, next) {
  try {
    const categories = await adminPostService.getCategories();
    res.render("admin/posts/form", {
      mode: "create",
      post: null,
      categories
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const payload = mapFormBody(req.body);
    if (!payload.title) {
      const categories = await adminPostService.getCategories();
      return res.status(400).render("admin/posts/form", {
        mode: "create",
        post: payload,
        categories,
        error: "Заголовок обязателен."
      });
    }
    const id = await adminPostService.createPost(payload);
    return res.redirect(`/admin/posts/${id}/edit`);
  } catch (err) {
    next(err);
  }
}

async function editForm(req, res, next) {
  try {
    const [post, categories] = await Promise.all([
      adminPostService.getPostById(Number(req.params.id)),
      adminPostService.getCategories()
    ]);
    if (!post) return res.status(404).render("404");
    return res.render("admin/posts/form", {
      mode: "edit",
      post,
      categories
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const payload = mapFormBody(req.body);
    if (!payload.title) {
      const categories = await adminPostService.getCategories();
      return res.status(400).render("admin/posts/form", {
        mode: "edit",
        post: { ...payload, id },
        categories,
        error: "Заголовок обязателен."
      });
    }
    await adminPostService.updatePost(id, payload);
    return res.redirect(`/admin/posts/${id}/edit`);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await adminPostService.deletePost(Number(req.params.id));
    return res.redirect("/admin/posts");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  index,
  createForm,
  create,
  editForm,
  update,
  remove
};
