const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  connectMeta,
  metaCallback,
  getCampaigns,
  getCampaignInsights,
  getCampaignRecommendations,
  analyzeCampaign, 
} = require('../controllers/metaController');


// connect → butuh login dulu
router.get('/connect', verifyToken, connectMeta);

// callback dari Facebook → tidak pakai verifyToken
// karena Facebook yang hit endpoint ini, bukan user
router.get('/callback', metaCallback);

// ambil kampanye & insights → butuh login
router.get('/campaigns', verifyToken, getCampaigns);
router.get('/campaigns/:metaCampaignId/insights', verifyToken, getCampaignInsights);


router.get('/campaigns/:metaCampaignId/recommendations', verifyToken, getCampaignRecommendations);

router.post('/campaigns/:metaCampaignId/analyze', verifyToken, analyzeCampaign); 

module.exports = router;