const fs = require('fs');
const path = require('path');
const db = require('./db');

async function setupDatabase() {
  try {
    // Run schema.sql to create all tables
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    console.log('Reading schema from:', schemaPath);
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Schema file loaded, length:', schema.length);
    
    await db.query(schema);
    console.log('✅ Database tables created successfully');

    // Create default admin if none exists
    const bcrypt = require('bcrypt');
    const result = await db.query('SELECT * FROM admins LIMIT 1');
    
    if (result.rows.length === 0) {
      const passwordHash = await bcrypt.hash('Mightyman7$', 10);
      await db.query(`
        INSERT INTO admins (first_name, surname, cell, email, password_hash, role, province, city, church)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, ['Admin', 'User', '0123456789', 'symphonytone@gmail.com', passwordHash, 'super_admin', 'Gauteng', 'Johannesburg', 'Head Office']);
      console.log('✅ Default admin created: symphonytone@gmail.com / Mightyman7$');
    } else {
      console.log('ℹ️ Admin already exists, skipping default admin creation');
    }
  } catch (err) {
    console.error('❌ Database setup error:', err.message || err);
    console.error('Stack:', err.stack || 'No stack');
    throw err;
  }
}

module.exports = setupDatabase;
