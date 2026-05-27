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
  saveMetaConnection,
  disconnectMeta,
  getConnectedAccount,
} = require('../controllers/metaController');


// connect → butuh login dulu
router.get('/connect', verifyToken, connectMeta);

// callback dari Facebook → tidak pakai verifyToken
// karena Facebook yang hit endpoint ini, bukan user
router.get('/callback', metaCallback);

// simpan koneksi Meta Ads → butuh login
router.post('/save', verifyToken, saveMetaConnection);

// putus koneksi akun Meta Ads → butuh login
router.delete('/disconnect', verifyToken, disconnectMeta);

// ambil detail akun Meta Ads yang terhubung → butuh login
router.get('/account', verifyToken, getConnectedAccount);

// ambil kampanye & insights → butuh login
router.get('/campaigns', verifyToken, getCampaigns);
router.get('/campaigns/:metaCampaignId/insights', verifyToken, getCampaignInsights);


router.get('/campaigns/:metaCampaignId/recommendations', verifyToken, getCampaignRecommendations);

router.post('/campaigns/:metaCampaignId/analyze', verifyToken, analyzeCampaign); 

module.exports = router;