const pool = require("./pool");
const { db } = require("../config/env");

function table(name) {
  return `\`${db.prefix}_${name}\``;
}

async function ensureDleI18nColumns() {
  try {
    await pool.query(`ALTER TABLE ${table("category")} ADD COLUMN i18n JSON NULL`);
  } catch {
    // duplicate column
  }
}

module.exports = { ensureDleI18nColumns };
