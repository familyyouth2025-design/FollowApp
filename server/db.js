const { Pool } = require('pg');

// Fix truncated Render internal DB URLs by appending the region if missing
let databaseUrl = process.env.DATABASE_URL || '';
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
