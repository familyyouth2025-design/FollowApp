const db = require('../db');

async function findAll() {
  const { rows } = await db.query('SELECT * FROM events ORDER BY start_dt DESC');
  return rows;
}

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM events WHERE id = $1', [id]);
  return rows[0];
}

async function create(data) {
  const { rows } = await db.query(
    `INSERT INTO events (title, start_dt, end_dt, address, province, city, flier_url, target_amount, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.title, data.start_dt, data.end_dt, data.address, data.province, data.city, data.flier_url, data.target_amount, data.created_by]
  );
  return rows[0];
}

async function update(id, data) {
  const { rows } = await db.query(
    `UPDATE events SET title=$1, start_dt=$2, end_dt=$3, address=$4, province=$5, city=$6, flier_url=$7, target_amount=$8
     WHERE id=$9 RETURNING *`,
    [data.title, data.start_dt, data.end_dt, data.address, data.province, data.city, data.flier_url, data.target_amount, id]
  );
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM events WHERE id = $1', [id]);
}

module.exports = { findAll, findById, create, update, remove };
