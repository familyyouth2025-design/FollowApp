const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { list, get, add, edit, del, fuzzy } = require('../controllers/churchController');

router.get('/', verifyToken, list);
router.get('/search', verifyToken, fuzzy);
router.get('/:id', verifyToken, get);
router.post('/', verifyToken, add);
router.put('/:id', verifyToken, edit);
router.delete('/:id', verifyToken, del);

module.exports = router;
