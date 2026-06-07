const { Pool } = require('pg');

// The correct external database URL from Render
const CORRECT_DB_URL = 'postgresql://followapp:BLR5PuWGYzvxBkVVSKhq5SqmRtAPHFIt@dpg-d8hfhfjtqb8s739ra8rg-a.oregon-postgres.render.com/followapp';

let databaseUrl = process.env.DATABASE_URL || '';

// If URL is truncated (has @dpg- but missing .oregon-postgres.render.com), use correct URL
if (!databaseUrl || (databaseUrl.includes('@dpg-') && !databaseUrl.includes('.oregon-postgres.render.com'))) {
  console.log('DATABASE_URL truncated or missing, using correct URL');
  databaseUrl = CORRECT_DB_URL;
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
