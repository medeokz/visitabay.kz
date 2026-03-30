const fs = require("fs");
const path = require("path");
const pool = require("../src/db/pool");
const { db } = require("../src/config/env");
function extractTour3dHtmlFromXfields(raw) {
  const m = String(raw || "").match(/tour3d_html\|([^|]+?)(?:\|\||$)/);
  return m ? String(m[1] || "").trim() : "";
}

function inCategory(csv, id) {
  if (!id || csv == null) return false;
  const sid = String(id);
  return String(csv)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(sid);
}

async function run() {
  const [posts] = await pool.query(
    `SELECT id, alt_name, category, xfields FROM \`${db.prefix}_post\` WHERE approve=1 AND alt_name<>''`
  );
  const [cats] = await pool.query(
    `SELECT id, alt_name FROM \`${db.prefix}_category\` WHERE active=1 AND alt_name<>''`
  );
  const [pages] = await pool.query(
    `SELECT name FROM \`${db.prefix}_static\` WHERE name<>''`
  );

  const cat3d = (cats || []).find((c) => String(c.alt_name) === "3d");
  const cat3dId = cat3d ? String(cat3d.id) : "";

  const map = [];

  for (const p of posts) {
    let toPath = `/post/${p.alt_name}`;
    if (p.alt_name === "3d") {
      toPath = "/category/3d";
    } else if (cat3dId && inCategory(p.category, cat3dId)) {
      const t3 = extractTour3dHtmlFromXfields(p.xfields);
      toPath = t3 ? `/3d/${t3}` : "/category/3d";
    }
    map.push({ from: `/${p.id}-${p.alt_name}.html`, to: toPath, code: 301 });
    map.push({ from: `/${p.alt_name}.html`, to: toPath, code: 301 });
  }
  for (const c of cats) {
    map.push({ from: `/${c.alt_name}/`, to: `/category/${c.alt_name}`, code: 301 });
  }
  map.push({ from: "/3d/", to: "/category/3d", code: 301 });
  for (const s of pages) {
    map.push({ from: `/index.php?do=static&page=${s.name}`, to: `/page/${s.name}`, code: 301 });
  }

  const outPath = path.join(__dirname, "..", "docs", "redirect-map.json");
  fs.writeFileSync(outPath, JSON.stringify(map, null, 2), "utf8");
  // eslint-disable-next-line no-console
  console.log(`Redirect map written: ${outPath}. Entries: ${map.length}`);
  await pool.end();
}

run().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  try { await pool.end(); } catch (_) {}
  process.exit(1);
});
