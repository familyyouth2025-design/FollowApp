const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { list, get, add, edit, del, files } = require('../controllers/eventController');

router.get('/', verifyToken, list);
router.get('/:id', verifyToken, get);
router.post('/', verifyToken, add);
router.put('/:id', verifyToken, edit);
router.delete('/:id', verifyToken, del);
router.get('/:id/files', verifyToken, files);

module.exports = router;
