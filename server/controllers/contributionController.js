const { findByEvent, upsert, getEventTotal } = require('../models/contributions');

async function list(req, res) {
  const { event_id } = req.query;
  if (!event_id) return res.status(400).json({ error: 'event_id required' });
  const rows = await findByEvent(event_id);
  const total = await getEventTotal(event_id);
  res.json({ contributions: rows, total: Number(total) });
}

async function update(req, res) {
  const row = await upsert(req.body);
  res.json(row);
}

module.exports = { list, update };
