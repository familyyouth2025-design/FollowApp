const db = require('../db');

async function findAll(filters = {}) {
  let sql = 'SELECT * FROM members WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.province) { sql += ` AND province = $${idx++}`; params.push(filters.province); }
  if (filters.taskforce) { sql += ` AND taskforce = $${idx++}`; params.push(filters.taskforce); }
  if (filters.age_range) { sql += ` AND age_range = $${idx++}`; params.push(filters.age_range); }
  if (filters.search) {
    sql += ` AND (first_name ILIKE $${idx} OR surname ILIKE $${idx} OR cell ILIKE $${idx} OR city ILIKE $${idx})`;
    params.push(`%${filters.search}%`);
    idx++;
  }
  if (filters.flagged === 'true') { sql += ` AND whatsapp_valid = false`; }

  sql += ' ORDER BY created_at DESC';
  const { rows } = await db.query(sql, params);
  return rows;
}

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM members WHERE id = $1', [id]);
  return rows[0];
}

async function create(data) {
  // Auto-create church if it doesn't exist
  if (data.church && data.church.trim()) {
    await db.query(
      `INSERT INTO churches (name, province, city) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
      [data.church.trim(), data.province || null, data.city || null]
    );
  }
  const { rows } = await db.query(
    `INSERT INTO members (first_name, surname, cell, gender, age, birthday, province, city, church, taskforce, age_range)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [data.first_name, data.surname, data.cell, data.gender, data.age, data.birthday,
     data.province, data.city, data.church, data.taskforce, data.age_range]
  );
  return rows[0];
}

async function update(id, data) {
  // Auto-create church if it doesn't exist
  if (data.church && data.church.trim()) {
    await db.query(
      `INSERT INTO churches (name, province, city) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
      [data.church.trim(), data.province || null, data.city || null]
    );
  }
  const { rows } = await db.query(
    `UPDATE members SET
      first_name = $1, surname = $2, cell = $3, gender = $4, age = $5, birthday = $6,
      province = $7, city = $8, church = $9, taskforce = $10, age_range = $11
     WHERE id = $12 RETURNING *`,
    [data.first_name, data.surname, data.cell, data.gender, data.age, data.birthday,
     data.province, data.city, data.church, data.taskforce, data.age_range, id]
  );
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM members WHERE id = $1', [id]);
}

async function setWhatsappValid(id, valid) {
  await db.query('UPDATE members SET whatsapp_valid = $1 WHERE id = $2', [valid, id]);
}

async function getStats() {
  const { rows } = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM members) AS total_members,
      (SELECT COUNT(*) FROM members WHERE whatsapp_valid = false) AS flagged
  `);
  return rows[0];
}

module.exports = { findAll, findById, create, update, remove, setWhatsappValid, getStats };
