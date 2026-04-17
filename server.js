require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config/default');
const { getPool } = require('./config/database');

// Use connect-pg-simple for session storage (works with Supabase PostgreSQL)
const pgSession = require('connect-pg-simple')(session);
const sessionConfig = {
  store: new pgSession({
    pool: getPool(),
    tableName: 'session',
    createTableIfMissing: false,
  }),
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 86400000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
};

const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const adminApiRoutes = require('./routes/admin-api');
const authMiddleware = require('./middleware/auth');

const app = express();

// Trust proxy for Railway/Render deployments
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Redirect pepeyuan.com to www.pepeyuan.com
app.use((req, res, next) => {
  const host = req.get('host');
  if (host === 'pepeyuan.com') {
    return res.redirect(301, `https://www.pepeyuan.com${req.originalUrl}`);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));

// Static files (local uploads for dev; Supabase Storage used in production via URLs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Public API
app.use('/api', apiRoutes);

// Auth
app.use('/auth', authRoutes);

// Admin login page (public)
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});
app.get('/admin/css/:file', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'css', req.params.file));
});
app.get('/admin/js/:file', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'js', req.params.file));
});

// Admin API (protected)
app.use('/admin/api', authMiddleware, adminApiRoutes);

// Admin pages (protected)
app.get('/admin', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.get('/admin/:page.html', authMiddleware, (req, res) => {
  const filePath = path.join(__dirname, 'admin', `${req.params.page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send('Page not found');
  });
});

// Frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/:page.html', (req, res) => {
  const allowed = ['about', 'timeline', 'entry'];
  if (allowed.includes(req.params.page)) {
    res.sendFile(path.join(__dirname, 'public', `${req.params.page}.html`));
  } else {
    res.status(404).send('Page not found');
  }
});

const PORT = process.env.PORT || config.port;

app.listen(PORT, () => {
  console.log(`Our Story is running at http://localhost:${PORT}`);
});
