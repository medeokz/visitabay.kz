function basePath(req) {
  return (req.app && req.app.locals && req.app.locals.basePath) || "";
}

/**
 * Публичный URL страниц админки гостиниц (см. BROWSER_ADMIN_BASE за прокси visitabay :4000).
 * @param {import("express").Request} req
 * @param {string} [pathWithinAdmin] например "login", "owners?ok=1", "edit/5" (без начального /)
 */
function adminPublicUrl(req, pathWithinAdmin) {
  const alt = req.app && req.app.locals && req.app.locals.browserAdminBase;
  const sub =
    pathWithinAdmin == null || pathWithinAdmin === ""
      ? ""
      : String(pathWithinAdmin).replace(/^\//, "");
  if (alt) {
    const root = String(alt).replace(/\/$/, "");
    if (!sub) return `${root}/`;
    return `${root}/${sub}`;
  }
  const bp = basePath(req);
  if (!sub) return `${bp}/admin`;
  return `${bp}/admin/${sub}`;
}

module.exports = { adminPublicUrl, basePath };
