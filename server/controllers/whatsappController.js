const { getStatus, getQR, disconnectClient, initClient } = require('../whatsapp');

async function status(req, res) {
  res.json(await getStatus());
}

async function qr(req, res) {
  initClient();
  // Wait a moment for QR to generate
  await new Promise(r => setTimeout(r, 3000));
  const qr = getQR();
  if (!qr) return res.status(404).json({ error: 'No QR available' });
  res.json({ qr });
}

async function disconnect(req, res) {
  await disconnectClient();
  res.json({ ok: true });
}

module.exports = { status, qr, disconnect };
