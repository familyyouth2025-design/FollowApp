const { findAll, findById, create, update, remove, getStats } = require('../models/members');

async function list(req, res) {
  const filters = {
    province: req.query.province,
    taskforce: req.query.taskforce,
    age_range: req.query.age_range,
    search: req.query.search,
    flagged: req.query.flagged,
  };
  const members = await findAll(filters);
  res.json(members);
}

async function get(req, res) {
  const member = await findById(req.params.id);
  if (!member) return res.status(404).json({ error: 'Not found' });
  res.json(member);
}

async function add(req, res) {
  const member = await create(req.body);
  res.status(201).json(member);
}

async function edit(req, res) {
  const member = await update(req.params.id, req.body);
  res.json(member);
}

async function del(req, res) {
  await remove(req.params.id);
  res.json({ ok: true });
}

async function stats(req, res) {
  const data = await getStats();
  res.json(data);
}

module.exports = { list, get, add, edit, del, stats };
