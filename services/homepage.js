// Homepage config service - Supabase PostgreSQL
const { getPool } = require('../config/database');

async function get() {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM homepage_config ORDER BY id DESC LIMIT 1');
  const row = result.rows[0];
  if (!row) return null;
  
  return {
    heroImage: row.hero_image,
    title: row.title,
    subtitle: row.subtitle,
    quote: row.quote,
    ctaText: row.cta_text,
    ctaLink: row.cta_link,
  };
}

async function update(updates) {
  const pool = getPool();
  const existing = await get();
  
  const dbUpdates = {};
  if (updates.heroImage !== undefined) dbUpdates.hero_image = updates.heroImage;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.subtitle !== undefined) dbUpdates.subtitle = updates.subtitle;
  if (updates.quote !== undefined) dbUpdates.quote = updates.quote;
  if (updates.ctaText !== undefined) dbUpdates.cta_text = updates.ctaText;
  if (updates.ctaLink !== undefined) dbUpdates.cta_link = updates.ctaLink;
  
  if (existing) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(dbUpdates)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    if (fields.length === 0) return existing;
    
    fields.push(`updated_at = NOW()`);
    values.push(existing.id);
    
    const query = `UPDATE homepage_config SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      heroImage: row.hero_image, title: row.title, subtitle: row.subtitle,
      quote: row.quote, ctaText: row.cta_text, ctaLink: row.cta_link,
    };
  } else {
    const result = await pool.query(
      `INSERT INTO homepage_config (hero_image, title, subtitle, quote, cta_text, cta_link)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [dbUpdates.hero_image, dbUpdates.title, dbUpdates.subtitle, dbUpdates.quote, dbUpdates.cta_text, dbUpdates.cta_link]
    );
    const row = result.rows[0];
    return {
      heroImage: row.hero_image, title: row.title, subtitle: row.subtitle,
      quote: row.quote, ctaText: row.cta_text, ctaLink: row.cta_link,
    };
  }
}

module.exports = { get, update };
