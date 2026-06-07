const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { list, update } = require('../controllers/contributionController');

router.get('/', verifyToken, list);
router.put('/', verifyToken, update);

module.exports = router;
