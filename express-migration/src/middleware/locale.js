const { COOKIE_NAME, normalizeLang, PRIMARY_LOCALE } = require("../../../hotels/utils/i18n");
const { getMenuFooter } = require("../i18n/menuFooterI18n");

const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

function localeMiddleware(req, res, next) {
  const q = normalizeLang(req.query && req.query.lang);
  if (q) {
    res.cookie(COOKIE_NAME, q, { maxAge: MAX_AGE_MS, sameSite: "lax", path: "/" });
    res.locals.lang = q;
  } else {
    const fromCookie = normalizeLang(req.cookies && req.cookies[COOKIE_NAME]);
    res.locals.lang = fromCookie || PRIMARY_LOCALE;
  }
  req.locale = res.locals.lang;
  try {
    res.locals.menuFooter = getMenuFooter(res.locals.lang);
  } catch (e) {
    res.locals.menuFooter = getMenuFooter(PRIMARY_LOCALE);
  }
  next();
}

module.exports = localeMiddleware;
