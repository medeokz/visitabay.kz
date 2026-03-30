const path = require("path");
const fs = require("fs");

// Явный путь: на Passenger/cPanel cwd часто не совпадает с каталогом приложения.
const envFile = path.join(__dirname, "..", "..", ".env");
if (fs.existsSync(envFile)) {
  require("dotenv").config({ path: envFile });
} else {
  require("dotenv").config();
}

/** Публичный префикс URL при работе за Apache в подпапке, напр. /visitabay.kz (без слеша в конце). */
function normalizePublicBasePath() {
  let b = String(process.env.PUBLIC_BASE_PATH || "").trim();
  if (!b) return "";
  // Частая ошибка в панели хостинга: вставили полный URL — иначе получилось бы "/https://..."
  if (/^https?:\/\//i.test(b)) {
    try {
      const u = new URL(b);
      b = u.pathname || "";
    } catch (_) {
      b = "";
    }
  }
  if (!b) return "";
  if (!b.startsWith("/")) b = `/${b}`;
  return b.replace(/\/+$/, "");
}

module.exports = {
  port: parseInt(process.env.PORT || "4000", 10),
  publicBasePath: normalizePublicBasePath(),
  nodeEnv: process.env.NODE_ENV || "development",
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "visitabay",
    prefix: process.env.DB_PREFIX || "abay"
  }
};
