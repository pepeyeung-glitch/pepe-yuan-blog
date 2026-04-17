#!/usr/bin/env node
/**
 * 数据迁移脚本：将本地 JSON 数据和图片迁移到 Supabase
 * 运行：node scripts/migrate-to-supabase.cjs
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const { v4: uuidv4, v5: uuidv5 } = require('uuid');
const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const BUCKET = 'blog-images';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ─── 工具函数 ────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 确保 id 是合法 UUID，否则用 v5 生成一个稳定的 UUID */
function normalizeId(id) {
  if (!id) return uuidv4();
  if (UUID_RE.test(id)) return id;
  return uuidv5(id, UUID_NAMESPACE);
}


/**
 * 上传本地图片到 Supabase Storage，返回公开 URL
 * 如果图片已是 http URL，直接返回
 */
async function migrateImage(localPath) {
  if (!localPath) return '';
  if (localPath.startsWith('http')) return localPath;

  // 兼容 /uploads/xxx.jpg 格式
  const filename = path.basename(localPath);
  const fullPath = path.join(__dirname, '..', 'uploads', filename);

  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠  图片文件不存在，跳过: ${fullPath}`);
    return localPath; // 保留原路径
  }

  const fileBuffer = fs.readFileSync(fullPath);
  const ext = path.extname(filename).toLowerCase();
  const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
  const contentType = mimeMap[ext] || 'image/jpeg';

  // 检查是否已存在
  const { data: exists } = await supabase.storage.from(BUCKET).list('', { search: filename });
  if (exists && exists.find(f => f.name === filename)) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    console.log(`  ✓ 已存在，跳过上传: ${filename}`);
    return data.publicUrl;
  }

  const { error } = await supabase.storage.from(BUCKET).upload(filename, fileBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    console.warn(`  ⚠  上传失败 ${filename}: ${error.message}`);
    return localPath;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  console.log(`  ✓ 已上传: ${filename}`);
  return data.publicUrl;
}

// ─── 主迁移逻辑 ──────────────────────────────────────────

async function main() {
  console.log('🚀 开始迁移数据到 Supabase...\n');
  const client = await pool.connect();

  try {
    // ── 1. 迁移 entries ──────────────────────────────────
    console.log('📋 迁移 entries...');
    const entriesData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'entries.json'), 'utf-8'));
    const entries = entriesData.entries || [];

    for (const entry of entries) {
      const entryId = normalizeId(entry.id);

      // 检查是否已存在
      const { rows: existing } = await client.query('SELECT id FROM entries WHERE id = $1', [entryId]);
      if (existing.length > 0) {
        console.log(`  ↷ 跳过已存在的 entry: ${entry.title}`);
        continue;
      }

      const imageUrl = await migrateImage(entry.image);

      await client.query(
        `INSERT INTO entries (id, title, story, image, date, location, category, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          entryId,
          entry.title,
          entry.story || '',
          imageUrl,
          entry.date ? new Date(entry.date) : null,
          entry.location || '',
          entry.category || 'travel',
          entry.tags || [],
          entry.createdAt ? new Date(entry.createdAt) : new Date(),
          entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
        ]
      );
      console.log(`  ✓ ${entry.title}`);
    }

    // ── 2. 迁移 homepage_config ──────────────────────────
    console.log('\n🏠 迁移 homepage_config...');
    const homepageData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'homepage.json'), 'utf-8'));

    const { rows: hpRows } = await client.query('SELECT id FROM homepage_config LIMIT 1');
    const heroImageUrl = await migrateImage(homepageData.heroImage);

    if (hpRows.length > 0) {
      await client.query(
        `UPDATE homepage_config SET hero_image=$1, title=$2, subtitle=$3, quote=$4, cta_text=$5, cta_link=$6, updated_at=NOW() WHERE id=$7`,
        [heroImageUrl, homepageData.title, homepageData.subtitle, homepageData.quote, homepageData.ctaText, homepageData.ctaLink, hpRows[0].id]
      );
      console.log('  ✓ homepage_config 已更新');
    } else {
      await client.query(
        `INSERT INTO homepage_config (hero_image, title, subtitle, quote, cta_text, cta_link) VALUES ($1,$2,$3,$4,$5,$6)`,
        [heroImageUrl, homepageData.title, homepageData.subtitle, homepageData.quote, homepageData.ctaText, homepageData.ctaLink]
      );
      console.log('  ✓ homepage_config 已插入');
    }

    // ── 3. 迁移 about_config ─────────────────────────────
    console.log('\n👫 迁移 about_config...');
    const aboutData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'about.json'), 'utf-8'));

    const { rows: abRows } = await client.query('SELECT id FROM about_config LIMIT 1');
    const midImageUrl = await migrateImage(aboutData.midImage);
    const heroImageUrl2 = await migrateImage(aboutData.heroImage);

    if (abRows.length > 0) {
      await client.query(
        `UPDATE about_config SET heading=$1, content_title=$2, top_paragraphs=$3, bottom_paragraphs=$4, mid_image=$5, hero_image=$6, updated_at=NOW() WHERE id=$7`,
        [
          aboutData.heading,
          aboutData.contentTitle,
          aboutData.topParagraphs || [],
          aboutData.bottomParagraphs || [],
          midImageUrl,
          heroImageUrl2,
          abRows[0].id,
        ]
      );
      console.log('  ✓ about_config 已更新');
    } else {
      await client.query(
        `INSERT INTO about_config (heading, content_title, top_paragraphs, bottom_paragraphs, mid_image, hero_image) VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          aboutData.heading,
          aboutData.contentTitle,
          aboutData.topParagraphs || [],
          aboutData.bottomParagraphs || [],
          midImageUrl,
          heroImageUrl2,
        ]
      );
      console.log('  ✓ about_config 已插入');
    }

    // ── 4. 验证 ───────────────────────────────────────────
    console.log('\n✅ 迁移完成！验证数据...');
    const { rows: entryCount } = await client.query('SELECT COUNT(*) FROM entries');
    const { rows: hpCheck } = await client.query('SELECT title FROM homepage_config LIMIT 1');
    const { rows: abCheck } = await client.query('SELECT heading FROM about_config LIMIT 1');

    console.log(`  entries: ${entryCount[0].count} 条`);
    console.log(`  homepage: "${hpCheck[0]?.title || '(空)'}"`);
    console.log(`  about: "${abCheck[0]?.heading || '(空)'}"`);

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('\n❌ 迁移失败:', err.message);
  process.exit(1);
});
