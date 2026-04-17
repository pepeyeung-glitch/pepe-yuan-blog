const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadToSupabase, deleteFromSupabase } = require('../middleware/upload');
const entries = require('../services/entries');
const homepage = require('../services/homepage');
const about = require('../services/about');
const ai = require('../services/ai');
const messages = require('../services/messages');

// --- Entry CRUD ---

router.get('/entries', async (req, res) => {
  try {
    const { category, page, limit } = req.query;
    const result = await entries.getAll({
      category,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: '获取条目列表失败' });
  }
});

router.post('/entries', upload.single('image'), async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadToSupabase(req.file);
    }

    const data = {
      title: req.body.title,
      story: req.body.story,
      date: req.body.date,
      location: req.body.location,
      category: req.body.category,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      image: imageUrl,
    };
    const entry = await entries.create(data);
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: '创建条目失败: ' + err.message });
  }
});

router.put('/entries/:id', upload.single('image'), async (req, res) => {
  try {
    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.story !== undefined) updates.story = req.body.story;
    if (req.body.date !== undefined) updates.date = req.body.date;
    if (req.body.location !== undefined) updates.location = req.body.location;
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.tags !== undefined) updates.tags = JSON.parse(req.body.tags);

    if (req.file) {
      // Upload new image to Supabase Storage
      updates.image = await uploadToSupabase(req.file);

      // Delete old image if it was stored in Supabase
      const existing = await entries.getById(req.params.id);
      if (existing && existing.image) {
        await deleteFromSupabase(existing.image);
      }
    }

    const entry = await entries.update(req.params.id, updates);
    if (!entry) return res.status(404).json({ error: '条目不存在' });
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: '更新条目失败: ' + err.message });
  }
});

router.delete('/entries/:id', async (req, res) => {
  try {
    const removed = await entries.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: '条目不存在' });

    // Delete associated image from Supabase Storage
    if (removed.image) {
      await deleteFromSupabase(removed.image);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除条目失败' });
  }
});

// --- Homepage ---

router.get('/homepage', async (req, res) => {
  try {
    const data = await homepage.get();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '获取首页配置失败' });
  }
});

router.put('/homepage', upload.single('heroImage'), async (req, res) => {
  try {
    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.subtitle !== undefined) updates.subtitle = req.body.subtitle;
    if (req.body.quote !== undefined) updates.quote = req.body.quote;
    if (req.body.ctaText !== undefined) updates.ctaText = req.body.ctaText;
    if (req.body.ctaLink !== undefined) updates.ctaLink = req.body.ctaLink;

    if (req.file) {
      // Delete old hero image
      const existing = await homepage.get();
      if (existing && existing.heroImage) {
        await deleteFromSupabase(existing.heroImage);
      }
      updates.heroImage = await uploadToSupabase(req.file);
    }

    const data = await homepage.update(updates);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: '更新首页配置失败' });
  }
});

// --- About ---

router.get('/about', async (req, res) => {
  try {
    const data = await about.get();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '获取关于页配置失败' });
  }
});

router.put('/about', upload.single('midImage'), async (req, res) => {
  try {
    const updates = {};
    if (req.body.heading !== undefined) updates.heading = req.body.heading;
    if (req.body.contentTitle !== undefined) updates.contentTitle = req.body.contentTitle;
    if (req.body.topParagraphs !== undefined) updates.topParagraphs = JSON.parse(req.body.topParagraphs);
    if (req.body.bottomParagraphs !== undefined) updates.bottomParagraphs = JSON.parse(req.body.bottomParagraphs);
    if (req.body.heroImage !== undefined) updates.heroImage = req.body.heroImage;

    if (req.file) {
      // Delete old mid image
      const existing = await about.get();
      if (existing && existing.midImage) {
        await deleteFromSupabase(existing.midImage);
      }
      updates.midImage = await uploadToSupabase(req.file);
    }

    const data = await about.update(updates);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: '更新关于页配置失败: ' + err.message });
  }
});

// --- AI Story Generation ---

router.post('/ai/generate-story', async (req, res) => {
  try {
    const { date, location, tags, imageDescription } = req.body;
    const story = await ai.generateStory({ date, location, tags, imageDescription });
    res.json({ generatedStory: story });
  } catch (err) {
    res.status(500).json({ error: 'AI生成故事失败: ' + err.message });
  }
});

// --- Stats ---

router.get('/stats', async (req, res) => {
  try {
    const stats = await entries.getStats();
    const msgCount = await messages.getCount();
    res.json({ ...stats, messages: msgCount });
  } catch (err) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// --- Messages ---

router.get('/messages', async (req, res) => {
  try {
    const msgs = await messages.getAll();
    res.json({ messages: msgs });
  } catch (err) {
    res.status(500).json({ error: '获取消息列表失败' });
  }
});

router.delete('/messages/:id', async (req, res) => {
  try {
    const removed = await messages.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: '消息不存在' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除消息失败' });
  }
});

module.exports = router;
