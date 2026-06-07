const { Pool } = require('pg');

// The correct external database URL from Render
const FALLBACK_DB_URL = 'postgresql://followapp:BLR5PuWGYzvxBkVVSKhq5SqmRtAPHFIt@dpg-d8hfhfjtqb8s739ra8rg-a.oregon-postgres.render.com/followapp';

let databaseUrl = process.env.DATABASE_URL || FALLBACK_DB_URL;

// If URL is empty or still connects to localhost, use fallback
if (!databaseUrl || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
  console.log('DATABASE_URL missing/invalid, using fallback');
  databaseUrl = FALLBACK_DB_URL;
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
