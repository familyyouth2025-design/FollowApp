const bcrypt = require('bcrypt');
const { findAll, create, remove } = require('../models/admins');

async function list(req, res) {
  const admins = await findAll();
  res.json(admins);
}

async function add(req, res) {
  const { first_name, surname, cell, email, password, role, province, city, church } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const admin = await create({ first_name, surname, cell, email, password_hash: hash, role, province, city, church });
  res.status(201).json(admin);
}

async function del(req, res) {
  await remove(req.params.id);
  res.json({ ok: true });
}

module.exports = { list, add, del };
