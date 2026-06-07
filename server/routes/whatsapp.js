const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { status, qr, disconnect } = require('../controllers/whatsappController');
const fs = require('fs');
const path = require('path');

router.get('/status', status);
router.get('/qr', qr);
router.post('/disconnect', verifyToken, disconnect);

router.post('/clear-session', verifyToken, requireRole('super_admin'), (req, res) => {
  try {
    const authPath = path.join(__dirname, '..', '.wwebjs_auth');
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }
    res.json({ ok: true, message: 'WhatsApp session cleared. Restart server to generate new QR code.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
