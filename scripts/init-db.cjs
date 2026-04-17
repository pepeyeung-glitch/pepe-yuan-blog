#!/usr/bin/env node
/**
 * Supabase Database Initialization Script
 * Usage: node scripts/init-db.cjs
 */
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function executeSQL(sql) {
  const options = {
    hostname: SUPABASE_URL.replace('https://', '').replace('http://', ''),
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  };

  try {
    const result = await httpRequest(options, { sql });
    if (result.status === 200 || result.status === 204) {
      console.log('✓ SQL executed successfully');
      return true;
    } else {
      console.log(`✗ SQL failed (status ${result.status}):`, result.data);
      return false;
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
    return false;
  }
}

async function createTables() {
  console.log('Initializing Supabase database...\n');

  // Create entries table
  console.log('Creating entries table...');
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      story TEXT,
      image TEXT,
      date TIMESTAMP WITH TIME ZONE,
      location TEXT,
      category TEXT DEFAULT 'travel',
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create homepage_config table
  console.log('Creating homepage_config table...');
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS homepage_config (
      id SERIAL PRIMARY KEY,
      hero_image TEXT,
      title TEXT,
      subtitle TEXT,
      quote TEXT,
      cta_text TEXT,
      cta_link TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create about_config table
  console.log('Creating about_config table...');
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS about_config (
      id SERIAL PRIMARY KEY,
      heading TEXT,
      content_title TEXT,
      top_paragraphs TEXT[] DEFAULT '{}',
      bottom_paragraphs TEXT[] DEFAULT '{}',
      mid_image TEXT,
      hero_image TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create messages table
  console.log('Creating messages table...');
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create session table
  console.log('Creating session table...');
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP WITH TIME ZONE NOT NULL
    )
  `);

  // Create indexes
  console.log('Creating indexes...');
  await executeSQL(`CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date DESC)`);
  await executeSQL(`CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category)`);
  await executeSQL(`CREATE INDEX IF NOT EXISTS idx_entries_tags ON entries USING GIN(tags)`);

  // Disable RLS
  console.log('Disabling RLS...');
  await executeSQL(`ALTER TABLE entries DISABLE ROW LEVEL SECURITY`);
  await executeSQL(`ALTER TABLE homepage_config DISABLE ROW LEVEL SECURITY`);
  await executeSQL(`ALTER TABLE about_config DISABLE ROW LEVEL SECURITY`);
  await executeSQL(`ALTER TABLE messages DISABLE ROW LEVEL SECURITY`);

  console.log('\n✓ Database initialization complete!');
}

createTables().catch(console.error);
