const express = require('express');
const { sendCampaignEmail } = require('../controllers/adminCampaignController');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.post('/send', adminAuth, sendCampaignEmail);

module.exports = router;
