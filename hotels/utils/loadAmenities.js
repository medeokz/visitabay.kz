const path = require("path");
const fs = require("fs");

let cached;
let cachedMtime = 0;
const amenitiesPath = path.join(__dirname, "..", "config", "amenities.js");

/**
 * Список удобств; при изменении amenities.js на диске подтягивается заново
 * (қажет болса серверді қайта іске қоспай жаңартуға болады).
 */
function loadAmenities() {
  const st = fs.statSync(amenitiesPath);
  if (cached && st.mtimeMs === cachedMtime) return cached;
  delete require.cache[require.resolve("../config/amenities")];
  cached = require("../config/amenities");
  cachedMtime = st.mtimeMs;
  return cached;
}

module.exports = { loadAmenities };
