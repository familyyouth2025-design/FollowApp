const { findAll, findById, findByName, create, update, remove, getStats, getMembers, getTaskforces } = require('../models/churches');

async function list(req, res) {
  const churches = await findAll();
  res.json(churches);
}

async function get(req, res) {
  const church = await findById(req.params.id);
  if (!church) return res.status(404).json({ error: 'Not found' });
  const stats = await getStats(req.params.id);
  const members = await getMembers(req.params.id);
  const taskforces = await getTaskforces(req.params.id);
  res.json({ ...church, stats, members, taskforces });
}

async function add(req, res) {
  const church = await create(req.body);
  res.status(201).json(church);
}

async function edit(req, res) {
  const church = await update(req.params.id, req.body);
  res.json(church);
}

async function del(req, res) {
  await remove(req.params.id);
  res.json({ ok: true });
}

async function fuzzy(req, res) {
  const { q } = req.query;
  if (!q) return res.json(null);
  const church = await findByName(q);
  res.json(church || null);
}

module.exports = { list, get, add, edit, del, fuzzy };
