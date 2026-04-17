// Messages service - Supabase PostgreSQL
const { getPool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function getAll() {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM blog_messages ORDER BY created_at DESC');
  return result.rows;
}

async function create(message) {
  const pool = getPool();
  const id = uuidv4();
  const result = await pool.query(
    'INSERT INTO blog_messages (id, name, email, message, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
    [id, message.name, message.email, message.message]
  );
  return result.rows[0];
}

async function remove(id) {
  const pool = getPool();
  const message = await pool.query('SELECT * FROM blog_messages WHERE id = $1', [id]);
  if (message.rows.length === 0) return null;
  await pool.query('DELETE FROM blog_messages WHERE id = $1', [id]);
  return message.rows[0];
}

async function getCount() {
  const pool = getPool();
  const result = await pool.query('SELECT COUNT(*) FROM blog_messages');
  return parseInt(result.rows[0].count);
}

module.exports = { getAll, create, remove, getCount };
