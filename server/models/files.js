const db = require('../db');

async function findByEvent(eventId) {
  const { rows } = await db.query(
    'SELECT * FROM event_files WHERE event_id = $1 ORDER BY uploaded_at DESC',
    [eventId]
  );
  return rows;
}

async function create({ event_id, filename, original_name, file_type }) {
  const { rows } = await db.query(
    `INSERT INTO event_files (event_id, filename, original_name, file_type)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [event_id, filename, original_name, file_type]
  );
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM event_files WHERE id = $1', [id]);
}

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM event_files WHERE id = $1', [id]);
  return rows[0];
}

module.exports = { findByEvent, create, remove, findById };
