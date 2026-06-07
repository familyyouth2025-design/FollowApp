const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/auth');
const { upload, del } = require('../controllers/fileController');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const uploadMiddleware = multer({ storage });

router.post('/events/:event_id/files', verifyToken, uploadMiddleware.single('file'), upload);
router.delete('/:id', verifyToken, del);

module.exports = router;
