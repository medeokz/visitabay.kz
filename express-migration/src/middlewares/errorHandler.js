const { getMenuFooter } = require("../i18n/menuFooterI18n");
const { PRIMARY_LOCALE } = require("../../../hotels/utils/i18n");

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error("Express error:", err);
  if (res.headersSent) return next(err);
  const loc = (req && req.locale) || (res.locals && res.locals.lang) || PRIMARY_LOCALE;
  res.status(500).render("500", {
    message: "Internal server error",
    menuFooter: getMenuFooter(loc),
    lang: loc
  });
}

module.exports = errorHandler;
