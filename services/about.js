// About config service - Supabase PostgreSQL
const { getPool } = require('../config/database');

async function get() {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM about_config ORDER BY id DESC LIMIT 1');
  const row = result.rows[0];
  if (!row) return null;
  
  return {
    heading: row.heading,
    contentTitle: row.content_title,
    topParagraphs: row.top_paragraphs || [],
    bottomParagraphs: row.bottom_paragraphs || [],
    midImage: row.mid_image,
    heroImage: row.hero_image,
  };
}

async function update(updates) {
  const pool = getPool();
  const existing = await get();
  
  const dbUpdates = {};
  if (updates.heading !== undefined) dbUpdates.heading = updates.heading;
  if (updates.contentTitle !== undefined) dbUpdates.content_title = updates.contentTitle;
  if (updates.topParagraphs !== undefined) dbUpdates.top_paragraphs = updates.topParagraphs;
  if (updates.bottomParagraphs !== undefined) dbUpdates.bottom_paragraphs = updates.bottomParagraphs;
  if (updates.midImage !== undefined) dbUpdates.mid_image = updates.midImage;
  if (updates.heroImage !== undefined) dbUpdates.hero_image = updates.heroImage;
  
  if (existing) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(dbUpdates)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(Array.isArray(value) ? `{${value.map(p => `"${p}"`).join(',')}}` : value);
      paramIndex++;
    }
    
    if (fields.length === 0) return existing;
    
    fields.push(`updated_at = NOW()`);
    values.push(existing.id);
    
    const query = `UPDATE about_config SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      heading: row.heading, contentTitle: row.content_title,
      topParagraphs: row.top_paragraphs || [], bottomParagraphs: row.bottom_paragraphs || [],
      midImage: row.mid_image, heroImage: row.hero_image,
    };
  } else {
    const result = await pool.query(
      `INSERT INTO about_config (heading, content_title, top_paragraphs, bottom_paragraphs, mid_image, hero_image)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [dbUpdates.heading, dbUpdates.content_title, dbUpdates.top_paragraphs || [], dbUpdates.bottom_paragraphs || [], dbUpdates.mid_image, dbUpdates.hero_image]
    );
    const row = result.rows[0];
    return {
      heading: row.heading, contentTitle: row.content_title,
      topParagraphs: row.top_paragraphs || [], bottomParagraphs: row.bottom_paragraphs || [],
      midImage: row.mid_image, heroImage: row.hero_image,
    };
  }
}

module.exports = { get, update };
