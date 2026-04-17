const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const config = require('../config/default');

// Admin login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    if (username !== config.admin.username) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isValidPassword = bcrypt.compareSync(password, config.admin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    req.session.authenticated = true;
    req.session.username = username;

    res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check auth status
router.get('/check', (req, res) => {
  res.json({
    authenticated: !!req.session.authenticated,
    username: req.session.username
  });
});

module.exports = router;
