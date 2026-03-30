function loginPath(req) {
  const alt = req.app && req.app.locals && req.app.locals.browserAdminBase;
  if (alt) {
    const r = String(alt).replace(/\/$/, '');
    return `${r}/login`;
  }
  const bp = (req.app && req.app.locals && req.app.locals.basePath) || '';
  return `${bp}/admin/login`;
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin && req.session.admin.role === 'admin') {
    return next();
  }
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(403).json({ error: 'Доступ только для администратора' });
  }
  res.redirect(loginPath(req));
}

function requireOwner(req, res, next) {
  if (req.session && req.session.admin && req.session.admin.role === 'owner') {
    return next();
  }
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(403).json({ error: 'Доступ только для хозяина гостиницы' });
  }
  res.redirect(loginPath(req));
}

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  const wantsJson = req.xhr || req.headers.accept?.includes('application/json') || (req.originalUrl && req.originalUrl.indexOf('/api') !== -1);
  if (wantsJson) {
    return res.status(401).json({ error: 'Войдите в панель управления' });
  }
  res.redirect(loginPath(req));
}

module.exports = { requireAdmin, requireOwner, requireAuth };
