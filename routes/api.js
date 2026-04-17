const express = require('express');
const router = express.Router();
const entries = require('../services/entries');
const homepage = require('../services/homepage');
const about = require('../services/about');
const messages = require('../services/messages');

router.get('/homepage', async (req, res) => {
  try {
    const data = await homepage.get();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '获取首页数据失败' });
  }
});

router.get('/about', async (req, res) => {
  try {
    const data = await about.get();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '获取关于页数据失败' });
  }
});

router.get('/entries', async (req, res) => {
  try {
    const { category, tag, page, limit } = req.query;
    const result = await entries.getAll({
      category,
      tag,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: '获取条目列表失败' });
  }
});

router.get('/entries/:id', async (req, res) => {
  try {
    const entry = await entries.getById(req.params.id);
    if (!entry) return res.status(404).json({ error: '条目不存在' });
    const neighbors = await entries.getNeighbors(req.params.id);
    res.json({ ...entry, ...neighbors });
  } catch (err) {
    res.status(500).json({ error: '获取条目详情失败' });
  }
});

router.post('/messages', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: '请填写所有字段' });
    }
    await messages.create({ name, email, message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '发送消息失败' });
  }
});

module.exports = router;
