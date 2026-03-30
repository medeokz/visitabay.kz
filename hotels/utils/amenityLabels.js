const { loadAmenities } = require("./loadAmenities");
const { PRIMARY_LOCALE } = require("./i18n");

function amenityLabel(amenity, locale) {
  if (!amenity) return "";
  const loc = locale || PRIMARY_LOCALE;
  if (loc === "en" && amenity.label_en) return amenity.label_en;
  if (loc === "kk") return amenity.label_kk || amenity.label_ru || "";
  if (loc === "ru" || loc === PRIMARY_LOCALE) return amenity.label_ru || amenity.label_kk || "";
  return amenity.label_kk || "";
}

/** Подписи удобств по выбранным ключам и языку сайта */
function labelsForAmenityKeys(keys, locale) {
  const amenitiesList = loadAmenities();
  const keySet = new Set(Array.isArray(keys) ? keys : []);
  return amenitiesList
    .filter((a) => a && keySet.has(a.key))
    .map((a) => amenityLabel(a, locale));
}

module.exports = { amenityLabel, labelsForAmenityKeys };
