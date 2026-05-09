const axios = require('axios');
const CryptoJS = require('crypto-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.JWT_SECRET;

// ── Helper enkripsi & dekripsi token ──────────────────────────
function encryptToken(token) {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
}

function decryptToken(encryptedToken) {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// ── [1] GET /api/meta/connect ──────────────────────────────────
// Kirim URL login Facebook ke frontend
const connectMeta = (req, res) => {
  const { META_APP_ID, META_REDIRECT_URI } = process.env;

  const scopes = [
    'ads_read',
    'ads_management',
    // 'read_insights',
    'business_management',
  ].join(',');

  const authUrl =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}` +
    `&scope=${scopes}` +
    `&response_type=code` +
    `&state=${req.user.userId}`;

  return res.json({ authUrl });
};

// ── [2] GET /api/meta/callback ─────────────────────────────────
// Tangkap code dari Facebook, tukar jadi token, simpan ke DB
const metaCallback = async (req, res) => {
  const { code, state: userId, error } = req.query;
  console.log('CODE DARI FACEBOOK:', code);
  console.log('USER ID:', userId);

  if (error) {
    return res.status(400).json({
      message: 'Pengguna menolak izin akses Meta Ads.',
    });
  }

  if (!code) {
    return res.status(400).json({
      message: 'Kode otorisasi tidak ditemukan.',
    });
  }

  try {
    const { META_APP_ID, META_APP_SECRET, META_REDIRECT_URI } = process.env;

    // Tukar code → short-lived token
    const tokenResponse = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          client_id: META_APP_ID,
          client_secret: META_APP_SECRET,
          redirect_uri: META_REDIRECT_URI,
          code,
        },
      }
    );

    const shortLivedToken = tokenResponse.data.access_token;

    // Tukar short-lived → long-lived token (~60 hari)
    const longTokenResponse = await axios.get(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: META_APP_ID,
          client_secret: META_APP_SECRET,
          fb_exchange_token: shortLivedToken,
        },
      }
    );

    const longLivedToken = longTokenResponse.data.access_token;

    // Ambil daftar ad account milik user
    const adAccountsResponse = await axios.get(
      'https://graph.facebook.com/v19.0/me/adaccounts',
      {
        params: {
          access_token: longLivedToken,
          fields: 'id,name',
        },
      }
    );

    const adAccounts = adAccountsResponse.data.data;

    if (!adAccounts || adAccounts.length === 0) {
      return res.status(404).json({
        message: 'Tidak ada akun iklan Meta yang ditemukan.',
      });
    }

    const firstAccount = adAccounts[0];
    const encryptedToken = encryptToken(longLivedToken);

    // Simpan ke database (upsert)
    const metaAccount = await prisma.metaAccount.upsert({
      where: {
        userId_accountId: {
          userId: parseInt(userId),
          accountId: firstAccount.id,
        },
      },
      update: {
        accessToken: encryptedToken,
        accountName: firstAccount.name,
      },
      create: {
        userId: parseInt(userId),
        accessToken: encryptedToken,
        accountId: firstAccount.id,
        accountName: firstAccount.name,
      },
    });

    // Redirect ke frontend setelah berhasil
    return res.redirect(
      `http://localhost:5173/dashboard?meta=connected&account=${metaAccount.accountName}`
    );
  } catch (err) {
    console.error('Error meta callback:', err.response?.data || err.message);
    return res.status(500).json({
      message: 'Gagal menghubungkan akun Meta Ads.',
      detail: err.response?.data?.error?.message || err.message,
    });
  }
};

// ── [3] GET /api/meta/campaigns ───────────────────────────────
// Ambil daftar kampanye dari Meta API
const getCampaigns = async (req, res) => {
  try {
    const userId = req.user.userId;

    const metaAccount = await prisma.metaAccount.findFirst({
      where: { userId },
    });

    if (!metaAccount) {
      return res.status(404).json({
        message: 'Akun Meta Ads belum dihubungkan.',
      });
    }

    const accessToken = decryptToken(metaAccount.accessToken);
    const adAccountId = metaAccount.accountId;

    const campaignsResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${adAccountId}/campaigns`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,daily_budget,lifetime_budget',
          limit: 50,
        },
      }
    );

    const campaigns = campaignsResponse.data.data;

    if (!campaigns || campaigns.length === 0) {
      return res.json({
        message: 'Tidak ada kampanye yang ditemukan.',
        campaigns: [],
      });
    }

    // Simpan ke database
    const savedCampaigns = [];
    for (const campaign of campaigns) {
      const saved = await prisma.campaign.upsert({
        where: {
          metaAccountId_metaCampaignId: {
            metaAccountId: metaAccount.id,
            metaCampaignId: campaign.id,
          },
        },
        update: {
          name: campaign.name,
          status: mapCampaignStatus(campaign.status),
        },
        create: {
          metaAccountId: metaAccount.id,
          metaCampaignId: campaign.id,
          name: campaign.name,
          status: mapCampaignStatus(campaign.status),
          date: new Date(),
        },
      });
      savedCampaigns.push(saved);
    }

    return res.json({
      message: 'Kampanye berhasil diambil.',
      total: savedCampaigns.length,
      campaigns: savedCampaigns,
    });
  } catch (err) {
    console.error('Error get campaigns:', err.response?.data || err.message);

    if (err.response?.data?.error?.code === 190) {
      return res.status(401).json({
        message: 'Token Meta Ads sudah kadaluarsa. Silakan hubungkan ulang.',
      });
    }

    return res.status(500).json({
      message: 'Gagal mengambil data kampanye.',
      detail: err.response?.data?.error?.message || err.message,
    });
  }
};

// ── [4] GET /api/meta/campaigns/:metaCampaignId/insights ──────
// Ambil metrik CTR, Spend, Reach, ROAS per kampanye
const getCampaignInsights = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { metaCampaignId } = req.params;

    const metaAccount = await prisma.metaAccount.findFirst({
      where: { userId },
    });

    if (!metaAccount) {
      return res.status(404).json({
        message: 'Akun Meta Ads belum dihubungkan.',
      });
    }

    const accessToken = decryptToken(metaAccount.accessToken);

    const insightsResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${metaCampaignId}/insights`,
      {
        params: {
          access_token: accessToken,
          fields: 'spend,ctr,reach,purchase_roas',
          date_preset: 'last_30d',
          level: 'campaign',
        },
      }
    );

    const insightsData = insightsResponse.data.data;

    if (!insightsData || insightsData.length === 0) {
      return res.json({
        message: 'Tidak ada data insights untuk periode ini.',
        insights: null,
      });
    }

    const raw = insightsData[0];

    // ROAS formatnya array of object di Meta API
    let roas = 0;
    if (raw.purchase_roas && raw.purchase_roas.length > 0) {
      roas = parseFloat(raw.purchase_roas[0].value) || 0;
    }

    const insights = {
      spend: parseFloat(raw.spend) || 0,
      ctr: parseFloat(raw.ctr) || 0,
      reach: parseInt(raw.reach) || 0,
      roas: roas,
    };

    await prisma.campaign.updateMany({
      where: {
        metaCampaignId: metaCampaignId,
        metaAccountId: metaAccount.id,
      },
      data: {
        spend: insights.spend,
        ctr: insights.ctr,
        roas: insights.roas,
        reach: insights.reach,
      },
    });
    
    return res.json({
      message: 'Insights berhasil diambil.',
      metaCampaignId,
      insights,
    });
  } catch (err) {
    console.error('Error get insights:', err.response?.data || err.message);

    if (err.response?.data?.error?.code === 190) {
      return res.status(401).json({
        message: 'Token Meta Ads sudah kadaluarsa. Silakan hubungkan ulang.',
      });
    }

    return res.status(500).json({
      message: 'Gagal mengambil insights kampanye.',
      detail: err.response?.data?.error?.message || err.message,
    });
  }
};

// ── Helper: mapping status Meta → enum Prisma ─────────────────
function mapCampaignStatus(metaStatus) {
  const map = {
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    DELETED: 'DELETED',
    ARCHIVED: 'ARCHIVED',
  };
  return map[metaStatus] || 'PAUSED';
}



// POST /api/meta/campaigns/:metaCampaignId/analyze
// Kirim data metrik ke AI Flask, simpan hasil ke tabel AiRecommendation
const analyzeCampaign = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { metaCampaignId } = req.params;

    // Ambil data kampanye dari DB
    const metaAccount = await prisma.metaAccount.findFirst({
      where: { userId },
    });

    if (!metaAccount) {
      return res.status(404).json({
        message: 'Akun Meta Ads belum dihubungkan.',
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        metaCampaignId: metaCampaignId,
        metaAccountId: metaAccount.id,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        message: 'Kampanye tidak ditemukan. Jalankan /campaigns dan /insights terlebih dahulu.',
      });
    }

    // Validasi: pastikan insights sudah ada (spend > 0)
    if (campaign.spend === 0 && campaign.ctr === 0) {
      return res.status(400).json({
        message: 'Data insights belum tersedia. Jalankan endpoint /insights terlebih dahulu.',
      });
    }

    // Kirim data ke AI Flask
    const aiResponse = await axios.post('http://localhost:5001/analyze', {
      ctr  : campaign.ctr,
      roas : campaign.roas,
      reach: campaign.reach,
      spend: campaign.spend,
    });

    const { score, label, color, breakdown, recommendations } = aiResponse.data;

    // Simpan atau update hasil AI ke tabel ai_recommendations
    const savedRecommendation = await prisma.aiRecommendation.upsert({
      where: {
        campaignId: campaign.id,
      },
      update: {
        score,
        recommendations: {
          label,
          color,
          breakdown,
          items: recommendations,
        },
      },
      create: {
        campaignId: campaign.id,
        score,
        recommendations: {
          label,
          color,
          breakdown,
          items: recommendations,
        },
      },
    });

    return res.json({
      message        : 'Analisis AI berhasil.',
      metaCampaignId,
      score,
      label,
      color,
      breakdown,
      recommendations,
    });

  } catch (err) {
    console.error('Error analyze campaign:', err.response?.data || err.message);

    // Kalau Flask tidak bisa dihubungi
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'AI Service tidak dapat dihubungi. Pastikan Flask server berjalan di port 5001.',
      });
    }

    return res.status(500).json({
      message: 'Gagal menganalisis kampanye.',
      detail : err.response?.data || err.message,
    });
  }
};




module.exports = {
  connectMeta,
  metaCallback,
  getCampaigns,
  getCampaignInsights,
  analyzeCampaign, 
  decryptToken,
};