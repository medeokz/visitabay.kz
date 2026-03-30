const express = require("express");
const adminController = require("../controllers/adminController");
const { uploadPostImages, uploadTour3dPoster } = require("../middlewares/adminUpload");

const router = express.Router();

// Защита админки DLE-style.
// Аутентификация переиспользует `req.session.admin`, которую создаёт модуль гостиниц.
// Важно: /admin/hotels/* оставляем без защиты, чтобы не ломать их логин/страницы.
router.use((req, res, next) => {
  const p = String(req.path || "");

  // Пропускаем страницы модуля гостиниц.
  if (p.startsWith("/hotels") || p === "/login") return next();

  const adminSession = req.session && req.session.admin;
  const ok = adminSession && (adminSession.role === "admin" || adminSession.role === "owner" || adminSession.id);
  if (ok) return next();

  return res.redirect(302, "/admin/login");
});

// Наш DLE-like "дашборд" доступен по /admin и /admin/site.
router.get("/", adminController.dashboard);
router.get("/site", adminController.dashboard);

router.get("/events", adminController.eventsSemeyAdmin);
router.get("/events/new", adminController.eventsSemeyCreateForm);
router.post("/events", uploadPostImages, adminController.eventsSemeyCreate);
router.get("/events/:id/edit", adminController.eventsSemeyEditForm);
router.post("/events/:id", uploadPostImages, adminController.eventsSemeyUpdate);
router.post("/events/:id/delete", adminController.eventsSemeyDelete);

router.get("/posts", adminController.posts);
router.get("/posts/3d", (req, res) => res.redirect(301, "/admin/3d"));
router.get("/posts/3d/new", (req, res) => res.redirect(301, "/admin/3d/new"));
router.get("/tours-3d", (req, res) => res.redirect(301, "/admin/3d"));
router.get("/tours-3d/new", (req, res) => res.redirect(301, "/admin/3d/new"));
router.get("/tours-3d/:id/edit", (req, res) => res.redirect(301, `/admin/3d/${req.params.id}/edit`));
router.get("/3d", adminController.tours3dList);
router.get("/3d/new", adminController.tours3dCreateForm);
router.post("/3d", uploadTour3dPoster, adminController.tours3dCreate);
router.get("/3d/:id/edit", adminController.tours3dEditForm);
router.post("/3d/:id", uploadTour3dPoster, adminController.tours3dUpdate);
router.post("/3d/:id/delete", adminController.tours3dDelete);
router.get("/posts/new", adminController.postCreateForm);
router.post("/posts", uploadPostImages, adminController.postCreate);
router.get("/posts/:id/edit", adminController.postEditForm);
router.post("/posts/:id", uploadPostImages, adminController.postUpdate);
router.post("/posts/:id/delete", adminController.postDelete);

router.get("/categories", adminController.categories);
router.get("/categories/new", adminController.categoryCreateForm);
router.post("/categories", adminController.categoryCreate);
router.get("/categories/:id/edit", adminController.categoryEditForm);
router.post("/categories/:id", adminController.categoryUpdate);
router.post("/categories/:id/delete", adminController.categoryDelete);

router.get("/settings", adminController.settingsForm);
router.post("/settings", adminController.settingsSave);

module.exports = router;
