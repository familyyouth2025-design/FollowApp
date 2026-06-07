const { Pool } = require('pg');

// Debug: log what DATABASE_URL contains (hide password)
const rawUrl = process.env.DATABASE_URL || '';
console.log('DATABASE_URL exists:', !!rawUrl);
console.log('DATABASE_URL length:', rawUrl.length);
if (rawUrl) {
  const masked = rawUrl.replace(/:([^@]+)@/, ':***@');
  console.log('DATABASE_URL (masked):', masked);
}

// Fix truncated Render internal DB URLs by appending the region if missing
let databaseUrl = rawUrl;
if (databaseUrl.includes('@dpg-') && !databaseUrl.includes('postgres.render.com')) {
  databaseUrl = databaseUrl.replace('/followapp', '.oregon-postgres.render.com/followapp');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error', err);
  process.exit(-1);
});

module.exports = pool;
