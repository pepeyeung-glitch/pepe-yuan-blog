// PostgreSQL database configuration
const { Pool } = require('pg');

let pool = null;

// Initialize database connection pool
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

// Test connection
async function testConnection() {
  try {
    const client = await getPool().connect();
    console.log('Database connected successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return false;
  }
}

module.exports = {
  getPool,
  testConnection,
};
