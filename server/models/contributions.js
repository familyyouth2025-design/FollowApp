const db = require('../db');

async function findByEvent(eventId) {
  const { rows } = await db.query(
    `SELECT m.id AS member_id, m.first_name, m.surname, m.cell, m.province,
            COALESCE(c.amount, 0) AS amount, c.id
     FROM members m
     LEFT JOIN contributions c ON c.member_id = m.id AND c.event_id = $1
     ORDER BY m.first_name`,
    [eventId]
  );
  return rows;
}

async function upsert({ event_id, member_id, amount }) {
  const { rows } = await db.query(
    `INSERT INTO contributions (event_id, member_id, amount)
     VALUES ($1,$2,$3)
     ON CONFLICT (event_id, member_id)
     DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
     RETURNING *`,
    [event_id, member_id, amount]
  );
  return rows[0];
}

async function getEventTotal(eventId) {
  const { rows } = await db.query(
    'SELECT COALESCE(SUM(amount),0) AS total FROM contributions WHERE event_id = $1',
    [eventId]
  );
  return rows[0].total;
}

module.exports = { findByEvent, upsert, getEventTotal };
