const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Shalom7$',
  database: 'postgres',
});

async function setup() {
  const client = await pool.connect();
  try {
    // Create database if not exists
    const dbExists = await client.query("SELECT 1 FROM pg_database WHERE datname = 'sayet'");
    if (dbExists.rowCount === 0) {
      await client.query('CREATE DATABASE sayet');
      console.log('Database "sayet" created');
    } else {
      console.log('Database "sayet" already exists');
    }
    client.release();

    // Connect to sayet database
    const sayetPool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'Shalom7$',
      database: 'sayet',
    });

    const sayetClient = await sayetPool.connect();
    try {
      // Run schema
      const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
      await sayetClient.query(schemaSQL);
      console.log('Schema applied successfully');

      // Run seed
      const seedPath = path.join(__dirname, '..', 'db', 'seed.sql');
      const seedSQL = fs.readFileSync(seedPath, 'utf-8');
      await sayetClient.query(seedSQL);
      console.log('Seed data inserted successfully');
    } finally {
      sayetClient.release();
    }
    await sayetPool.end();
  } finally {
    await pool.end();
  }
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
