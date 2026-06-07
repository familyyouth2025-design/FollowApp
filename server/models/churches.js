const db = require('../db');

async function findAll() {
  const { rows } = await db.query('SELECT * FROM churches ORDER BY name');
  return rows;
}

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM churches WHERE id = $1', [id]);
  return rows[0];
}

async function findByName(name) {
  const { rows } = await db.query('SELECT * FROM churches WHERE name ILIKE $1', [name]);
  return rows[0];
}

async function create({ name, province, city }) {
  const { rows } = await db.query(
    'INSERT INTO churches (name, province, city) VALUES ($1,$2,$3) RETURNING *',
    [name, province, city]
  );
  return rows[0];
}

async function update(id, { name, province, city }) {
  const { rows } = await db.query(
    'UPDATE churches SET name=$1, province=$2, city=$3 WHERE id=$4 RETURNING *',
    [name, province, city, id]
  );
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM churches WHERE id = $1', [id]);
}

async function getStats(id) {
  const { rows } = await db.query(
    `SELECT
      (SELECT COUNT(*) FROM members WHERE church = (SELECT name FROM churches WHERE id = $1)) AS member_count,
      (SELECT COUNT(*) FROM members WHERE church = (SELECT name FROM churches WHERE id = $1) AND gender = 'Male') AS male_count,
      (SELECT COUNT(*) FROM members WHERE church = (SELECT name FROM churches WHERE id = $1) AND gender = 'Female') AS female_count,
      (SELECT ROUND(AVG(age)::numeric, 1) FROM members WHERE church = (SELECT name FROM churches WHERE id = $1) AND age IS NOT NULL) AS avg_age,
      (SELECT COALESCE(SUM(c.amount), 0) FROM contributions c JOIN members m ON c.member_id = m.id WHERE m.church = (SELECT name FROM churches WHERE id = $1)) AS total_contributed`,
    [id]
  );
  return rows[0];
}

async function getMembers(id) {
  const { rows } = await db.query(
    `SELECT * FROM members WHERE church = (SELECT name FROM churches WHERE id = $1) ORDER BY first_name`,
    [id]
  );
  return rows;
}

async function getTaskforces(id) {
  const { rows } = await db.query(
    `SELECT taskforce, COUNT(*) AS count FROM members WHERE church = (SELECT name FROM churches WHERE id = $1) GROUP BY taskforce`,
    [id]
  );
  return rows;
}

module.exports = { findAll, findById, findByName, create, update, remove, getStats, getMembers, getTaskforces };
