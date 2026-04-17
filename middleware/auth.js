// Authentication middleware - session based
function authMiddleware(req, res, next) {
  if (!req.session.authenticated) {
    if (req.path.startsWith('/admin/api')) {
      return res.status(401).json({ error: '未登录' });
    }
    return res.redirect('/admin/login');
  }
  next();
}

module.exports = authMiddleware;
