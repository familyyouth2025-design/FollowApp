const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { listCampaigns, send, campaignLog } = require('../controllers/messageController');

router.get('/campaigns', verifyToken, listCampaigns);
router.get('/campaigns/:id/log', verifyToken, campaignLog);
router.post('/send', verifyToken, send);

module.exports = router;
