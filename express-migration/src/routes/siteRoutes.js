const express = require("express");
const siteController = require("../controllers/siteController");

const router = express.Router();

router.get("/", siteController.home);
router.get("/sobytija-semey", siteController.eventsSemeyPage);
router.get("/sobytija-semey/:slug", siteController.eventsSemeyBySlug);
router.get("/robots.txt", siteController.robotsTxt);
router.get("/sitemap.xml", siteController.sitemapXml);
router.get("/post/:slug", siteController.postBySlug);
router.get("/category/:slug", siteController.categoryBySlug);
router.get("/3d/:legacyHtml", siteController.tour3dPage);
router.get("/page/:name", siteController.staticPage);
router.get("/search", siteController.search);

// Legacy DLE compatibility routes.
router.get("/index.php", siteController.legacyStatic);
router.get("*.html", siteController.legacyHtml);
router.get("/:slug/", siteController.friendlyCatchAll);
router.get("/:slug", siteController.friendlyCatchAll);

module.exports = router;
