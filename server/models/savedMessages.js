const db = require('../db');

async function findAll() {
  const { rows } = await db.query('SELECT * FROM saved_messages ORDER BY created_at DESC');
  return rows;
}

async function create(data) {
  const { rows } = await db.query(
    'INSERT INTO saved_messages (name, template, created_by) VALUES ($1, $2, $3) RETURNING *',
    [data.name, data.template, data.created_by]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await db.query(
    'UPDATE saved_messages SET name = $1, template = $2 WHERE id = $3 RETURNING *',
    [data.name, data.template, id]
  );
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM saved_messages WHERE id = $1', [id]);
}

module.exports = { findAll, create, update, remove };
