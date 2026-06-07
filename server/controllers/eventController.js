const { findAll, findById, create, update, remove } = require('../models/events');
const { findByEvent: findFilesByEvent } = require('../models/files');
const { getEventTotal } = require('../models/contributions');

async function list(req, res) {
  const events = await findAll();
  const enriched = await Promise.all(events.map(async (e) => {
    const raised = await getEventTotal(e.id);
    return { ...e, raised: Number(raised) };
  }));
  res.json(enriched);
}

async function get(req, res) {
  const event = await findById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found' });
  const raised = await getEventTotal(event.id);
  res.json({ ...event, raised: Number(raised) });
}

async function add(req, res) {
  const event = await create({ ...req.body, created_by: req.admin.id });
  res.status(201).json(event);
}

async function edit(req, res) {
  const event = await update(req.params.id, req.body);
  res.json(event);
}

async function del(req, res) {
  await remove(req.params.id);
  res.json({ ok: true });
}

async function files(req, res) {
  const files = await findFilesByEvent(req.params.id);
  res.json(files);
}

module.exports = { list, get, add, edit, del, files };
