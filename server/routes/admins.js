const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { list, add, del } = require('../controllers/adminController');

router.get('/', verifyToken, list);
router.post('/', verifyToken, requireRole('super_admin'), add);
router.delete('/:id', verifyToken, requireRole('super_admin'), del);

module.exports = router;
