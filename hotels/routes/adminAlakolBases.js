const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { requireAdmin } = require("../middleware/auth");

function adminListUrl(req) {
  const bar = req.app.locals.browserAdminBase;
  if (bar) return `${String(bar).replace(/\/$/, "")}/alakol-bases`;
  return `${bp(req)}/admin/hotels/alakol-bases`;
}

router.get("/", requireAdmin, async (req, res) => {
  try {
    const [bases] = await pool.query(
      "SELECT * FROM alakol_bases ORDER BY sort_order ASC, name"
    );
    res.render("admin/alakol-bases", { bases });
  } catch (err) {
    console.error(err);
    res.render("admin/alakol-bases", { bases: [], error: "Ошибка загрузки" });
  }
});

router.get("/add", requireAdmin, (req, res) => {
  res.render("admin/alakol-base-form", { base: null });
});

router.get("/edit/:id", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM alakol_bases WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.redirect(adminListUrl(req));
    const row = rows[0];
    if (row.image_urls != null) {
      try {
        row.image_urls =
          typeof row.image_urls === "string" ? JSON.parse(row.image_urls) : row.image_urls;
        if (!Array.isArray(row.image_urls)) row.image_urls = [];
      } catch (_) {
        row.image_urls = [];
      }
    } else {
      row.image_urls = row.image_url ? [row.image_url] : [];
    }
    res.render("admin/alakol-base-form", { base: row });
  } catch (err) {
    res.redirect(adminListUrl(req));
  }
});

module.exports = router;
