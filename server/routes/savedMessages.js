const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { findAll, create, update, remove } = require('../models/savedMessages');

router.get('/', verifyToken, async (req, res) => {
  const messages = await findAll();
  res.json(messages);
});

router.post('/', verifyToken, async (req, res) => {
  const msg = await create({ ...req.body, created_by: req.admin.id });
  res.json(msg);
});

router.put('/:id', verifyToken, async (req, res) => {
  const msg = await update(req.params.id, req.body);
  res.json(msg);
});

router.delete('/:id', verifyToken, async (req, res) => {
  await remove(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
