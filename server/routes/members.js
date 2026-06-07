const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { list, get, add, edit, del, stats } = require('../controllers/memberController');

router.get('/', verifyToken, list);
router.get('/stats', verifyToken, stats);
router.get('/:id', verifyToken, get);
router.post('/', verifyToken, add);
router.put('/:id', verifyToken, edit);
router.delete('/:id', verifyToken, del);

module.exports = router;
