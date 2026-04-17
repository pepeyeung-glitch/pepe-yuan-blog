// Entries service - Supabase PostgreSQL
const { getPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function getAll(options = {}) {
  const { category, tag, page = 1, limit = 12 } = options;
  const pool = getPool();
  
  let whereClause = '';
  const params = [];
  let paramIndex = 1;
  
  if (category) {
    whereClause += ` WHERE category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }
  
  if (tag) {
    whereClause += whereClause ? ' AND' : ' WHERE';
    whereClause += ` $${paramIndex} = ANY(tags)`;
    params.push(tag);
    paramIndex++;
  }
  
  const countQuery = `SELECT COUNT(*) FROM entries${whereClause}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);
  
  const offset = (page - 1) * limit;
  const dataQuery = `SELECT * FROM entries${whereClause} ORDER BY date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  const dataResult = await pool.query(dataQuery, [...params, limit, offset]);
  
  return {
    entries: dataResult.rows,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  };
}

async function getById(id) {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM entries WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function getNeighbors(id) {
  const pool = getPool();
  
  const currentResult = await pool.query('SELECT date FROM entries WHERE id = $1', [id]);
  if (!currentResult.rows[0]) return { prevEntry: null, nextEntry: null };
  
  const currentDate = currentResult.rows[0].date;
  
  const nextResult = await pool.query(
    'SELECT id, title, date FROM entries WHERE date < $1 ORDER BY date DESC LIMIT 1',
    [currentDate]
  );
  
  const prevResult = await pool.query(
    'SELECT id, title, date FROM entries WHERE date > $1 ORDER BY date ASC LIMIT 1',
    [currentDate]
  );
  
  return {
    prevEntry: prevResult.rows[0] || null,
    nextEntry: nextResult.rows[0] || null
  };
}

async function create(entry) {
  const pool = getPool();
  const id = entry.id || uuidv4();
  const result = await pool.query(
    `INSERT INTO entries (id, title, story, image, date, location, category, tags, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
    [id, entry.title, entry.story, entry.image, entry.date, entry.location, entry.category, entry.tags || []]
  );
  return result.rows[0];
}

async function update(id, updates) {
  const pool = getPool();
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'id') continue;
    fields.push(`${key} = $${paramIndex}`);
    values.push(key === 'tags' && Array.isArray(value) ? `{${value.join(',')}}` : value);
    paramIndex++;
  }
  
  if (fields.length === 0) return await getById(id);
  
  fields.push(`updated_at = NOW()`);
  values.push(id);
  
  const query = `UPDATE entries SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function remove(id) {
  const pool = getPool();
  const entry = await getById(id);
  if (!entry) return null;
  
  await pool.query('DELETE FROM entries WHERE id = $1', [id]);
  return entry;
}

async function getStats() {
  const pool = getPool();
  
  const totalResult = await pool.query('SELECT COUNT(*) FROM entries');
  const travelResult = await pool.query("SELECT COUNT(*) FROM entries WHERE category = 'travel'");
  const weddingResult = await pool.query("SELECT COUNT(*) FROM entries WHERE category = 'wedding'");
  const dailyResult = await pool.query("SELECT COUNT(*) FROM entries WHERE category = 'daily'");
  const latestResult = await pool.query('SELECT title, date, location FROM entries ORDER BY date DESC LIMIT 1');
  
  return {
    total: parseInt(totalResult.rows[0].count),
    travel: parseInt(travelResult.rows[0].count),
    wedding: parseInt(weddingResult.rows[0].count),
    daily: parseInt(dailyResult.rows[0].count),
    latest: latestResult.rows[0] || null
  };
}

module.exports = { getAll, getById, getNeighbors, create, update, remove, getStats };
