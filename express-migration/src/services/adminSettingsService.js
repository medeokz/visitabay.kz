const fs = require("fs/promises");
const path = require("path");

const settingsFile = path.join(__dirname, "..", "..", "data", "admin-settings.json");

const defaults = {
  siteName: "Visit Abay",
  siteUrl: "http://127.0.0.1:4000",
  adminEmail: "info@visitabay.kz",
  postsPerPage: 20,
  maintenanceMode: false,
  updatedAt: null
};

async function ensureStore() {
  const dir = path.dirname(settingsFile);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(settingsFile);
  } catch (_) {
    await fs.writeFile(settingsFile, JSON.stringify(defaults, null, 2), "utf8");
  }
}

async function getSettings() {
  await ensureStore();
  const raw = await fs.readFile(settingsFile, "utf8");
  const parsed = JSON.parse(raw);
  return { ...defaults, ...parsed };
}

async function saveSettings(input) {
  const merged = {
    ...defaults,
    ...input,
    postsPerPage: Number(input.postsPerPage) || defaults.postsPerPage,
    maintenanceMode: Boolean(input.maintenanceMode),
    updatedAt: new Date().toISOString()
  };
  await ensureStore();
  await fs.writeFile(settingsFile, JSON.stringify(merged, null, 2), "utf8");
  return merged;
}

module.exports = {
  getSettings,
  saveSettings
};
