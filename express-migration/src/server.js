const path = require("path");

// Первой строкой: до require("./app"), иначе hotels/config/db и env не увидят .env при чужом cwd.
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// См. https://www.phusionpassenger.com/library/indepth/nodejs/reverse_port_binding.html
if (typeof PhusionPassenger !== "undefined") {
  PhusionPassenger.configure({ autoInstall: true });
}

const app = require("./app");
const { port } = require("./config/env");
const { initDb } = require("../../hotels/db/init");
const { ensureDleI18nColumns } = require("./db/ensureDleI18nColumns");
const eventsSemeyService = require("./services/eventsSemeyService");
const tour3dService = require("./services/tour3dService");

function listenAddress() {
  return typeof PhusionPassenger !== "undefined" ? "passenger" : port;
}

async function start() {
  await initDb();
  await ensureDleI18nColumns();
  await eventsSemeyService.ensureTable();
  await tour3dService.ensureTable();
  const addr = listenAddress();
  const server = app.listen(addr, () => {
    // eslint-disable-next-line no-console
    if (addr === "passenger") {
      console.log("Express app listening (Phusion Passenger)");
    } else {
      console.log(`Express migration server running at http://localhost:${addr}`);
    }
  });

  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`${signal} received, shutting down...`);
    server.close((err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error("Shutdown error:", err);
        process.exit(1);
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Server start failed:", err && err.stack ? err.stack : err);
  process.exit(1);
});
