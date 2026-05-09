const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  connectMeta,
  metaCallback,
  getCampaigns,
  getCampaignInsights,
} = require('../controllers/metaController');

router.get('/connect', verifyToken, connectMeta);
router.get('/callback', metaCallback);
router.get('/campaigns', verifyToken, getCampaigns);
router.get('/campaigns/:metaCampaignId/insights', verifyToken, getCampaignInsights);

module.exports = router;