const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const { exportMembers, importMembers, exportEvents, importEvents } = require('../controllers/csvController');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/members/export', verifyToken, exportMembers);
router.post('/members/import', verifyToken, upload.single('file'), importMembers);
router.get('/events/export', verifyToken, exportEvents);
router.post('/events/import', verifyToken, upload.single('file'), importEvents);

module.exports = router;
