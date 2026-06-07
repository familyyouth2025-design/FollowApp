const db = require('../db');

async function findAll() {
  const { rows } = await db.query(
    'SELECT id, first_name, surname, cell, email, role, province, city, church, created_at FROM admins ORDER BY created_at DESC'
  );
  return rows;
}

async function findByEmail(email) {
  const { rows } = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
  return rows[0];
}

async function findById(id) {
  const { rows } = await db.query(
    'SELECT id, first_name, surname, cell, email, role, province, city, church, created_at FROM admins WHERE id = $1',
    [id]
  );
  return rows[0];
}

async function create({ first_name, surname, cell, email, password_hash, role, province, city, church }) {
  const { rows } = await db.query(
    `INSERT INTO admins (first_name, surname, cell, email, password_hash, role, province, city, church)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, first_name, surname, cell, email, role, province, city, church, created_at`,
    [first_name, surname, cell, email, password_hash, role, province, city, church]
  );
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM admins WHERE id = $1', [id]);
}

module.exports = { findAll, findByEmail, findById, create, remove };
