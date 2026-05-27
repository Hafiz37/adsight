const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ===== CONNECT META ADS =====
exports.connectMeta = (req, res) => {
  try {
    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI;
    const scope = 'ads_read,ads_management,public_profile';

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Connect Meta error:', error);
    res.status(500).json({ message: 'Gagal membuat URL koneksi Meta Ads' });
  }
};

// ===== META CALLBACK =====
exports.metaCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ message: 'Kode autentikasi tidak ditemukan' });
    }

    // Tukar kode dengan access token
    const tokenResponse = await axios.get('https://graph.instagram.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code: code,
      },
    });

    const accessToken = tokenResponse.data.access_token;
    const accountId = tokenResponse.data.user_id;

    // Ambil info akun
    const accountResponse = await axios.get(`https://graph.instagram.com/v18.0/${accountId}`, {
      params: {
        fields: 'name,email',
        access_token: accessToken,
      },
    });

    const accountName = accountResponse.data.name || 'Unknown Account';

    // Simpan ke database
    const metaAccount = await prisma.metaAccount.upsert({
      where: {
        metaAccountId: String(accountId),
      },
      update: {
        accessToken: accessToken,
        accountName: accountName,
      },
      create: {
        userId: userId,
        metaAccountId: String(accountId),
        accessToken: accessToken,
        accountName: accountName,
      },
    });

    res.json({
      message: 'Akun Meta Ads berhasil terhubung',
      data: metaAccount,
    });
  } catch (error) {
    console.error('Meta callback error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Gagal menghubungkan akun Meta Ads',
      error: error.message,
    });
  }
};

// ===== GET CAMPAIGNS =====
exports.getCampaigns = async (req, res) => {
  try {
    // Pastikan req.user.id ada (cek di authController saat login/sign token)
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: 'User ID tidak valid. Silakan login ulang.' });
    }

    // 1. Ambil meta account user
    const metaAccount = await prisma.metaAccount.findFirst({
      where: { userId: userId },
    });

    if (!metaAccount) {
      return res.status(404).json({
        message: 'Akun Meta Ads belum terhubung. Silakan hubungkan terlebih dahulu.',
      });
    }

    // 2. Coba fetch dari API Meta Ads
    try {
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${metaAccount.accountId}/campaigns`, // Pakai accountId sesuai schema
        {
          params: {
            fields: 'id,name,status,insights.date_preset(last_30d){spend,impressions,clicks,ctr}',
            access_token: metaAccount.accessToken,
          },
        }
      );

      const campaignsFromApi = insightsResponse.data.data || [];

      // 3. Simpan/update campaigns ke database
      for (const campaign of campaignsFromApi) {
        await prisma.campaign.upsert({
          // Menggunakan unique compound key sesuai schema.prisma
          where: {
            metaAccountId_metaCampaignId: {
              metaAccountId: metaAccount.id,
              metaCampaignId: campaign.id,
            },
          },
          update: {
            name: campaign.name,
            status: campaign.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE', // Sesuaikan enum
          },
          create: {
            metaAccountId: metaAccount.id,
            metaCampaignId: campaign.id,
            name: campaign.name,
            status: campaign.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE',
            date: new Date(), // WAJIB ada karena di schema tidak opsional
          },
        });
      }
    } catch (apiError) {
      console.warn('Meta API error atau data kosong:', apiError.response?.data || apiError.message);
    }

    // 4. Ambil campaigns dari database (Field name sudah diperbaiki)
    const campaigns = await prisma.campaign.findMany({
      where: {
        metaAccount: {
          userId: userId,
        },
      },
      select: {
        id: true,
        metaCampaignId: true,
        name: true, // SUDAH DIPERBAIKI (sebelumnya campaignName)
        status: true,
        spend: true,
        reach: true,
        createdAt: true,
      },
    });

    res.json({
      message: 'Kampanye berhasil diambil',
      data: campaigns,
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      message: 'Gagal mengambil data kampanye',
      error: error.message,
    });
  }
};

// ===== GET CAMPAIGN INSIGHTS =====
exports.getCampaignInsights = async (req, res) => {
  try {
    const { metaCampaignId } = req.params;
    const userId = req.user.id;

    // Ambil campaign dari database
    const campaign = await prisma.campaign.findUnique({
      where: { metaCampaignId: metaCampaignId },
      include: {
        metaAccount: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Kampanye tidak ditemukan' });
    }

    // Verifikasi kepemilikan
    if (campaign.metaAccount.userId !== userId) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke kampanye ini' });
    }

    // Coba fetch dari Meta API
    let insightsData = null;
    try {
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${metaCampaignId}/insights`,
        {
          params: {
            fields: 'spend,impressions,clicks,ctr,actions,action_values',
            time_range: {
              since: '2025-01-01',
              until: '2025-05-27',
            },
            access_token: campaign.metaAccount.accessToken,
          },
        }
      );

      insightsData = insightsResponse.data.data[0] || null;
    } catch (apiError) {
      console.warn('Meta API insights error:', apiError.message);
    }

    // Jika tidak ada data dari API, gunakan data dummy
    if (!insightsData) {
      insightsData = {
        spend: 150000,
        impressions: 45000,
        clicks: 1800,
        ctr: '2.5',
        actions: [
          { action_type: 'offsite_conversion.fb_pixel_purchase', value: '12' },
        ],
        action_values: [
          { action_type: 'offsite_conversion.fb_pixel_purchase', value: '750000' },
        ],
      };
    }

    res.json({
      message: 'Data insights kampanye berhasil diambil',
      data: {
        metaCampaignId: metaCampaignId,
        name: campaign.name,
        status: campaign.status,
        insights: insightsData,
      },
    });
  } catch (error) {
    console.error('Get campaign insights error:', error);
    res.status(500).json({
      message: 'Gagal mengambil insights kampanye',
      error: error.message,
    });
  }
};

// ===== ANALYZE CAMPAIGN (Trigger AI) =====
exports.analyzeCampaign = async (req, res) => {
  try {
    const { metaCampaignId } = req.params;
    const userId = req.user.id;

    // Ambil campaign
    const campaign = await prisma.campaign.findUnique({
      where: { metaCampaignId: metaCampaignId },
      include: {
        metaAccount: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Kampanye tidak ditemukan' });
    }

    // Verifikasi kepemilikan
    if (campaign.metaAccount.userId !== userId) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke kampanye ini' });
    }

    // Fetch insights dari Meta API
    let insightsData = null;
    try {
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${metaCampaignId}/insights`,
        {
          params: {
            fields: 'spend,impressions,clicks,ctr,actions,action_values',
            time_range: {
              since: '2025-01-01',
              until: '2025-05-27',
            },
            access_token: campaign.metaAccount.accessToken,
          },
        }
      );

      insightsData = insightsResponse.data.data[0] || null;
    } catch (apiError) {
      console.warn('Meta API error, using dummy data:', apiError.message);
    }

    // Gunakan dummy data jika API gagal
    if (!insightsData) {
      insightsData = {
        spend: 150000,
        impressions: 45000,
        clicks: 1800,
        ctr: '2.5',
        actions: [
          { action_type: 'offsite_conversion.fb_pixel_purchase', value: '12' },
        ],
        action_values: [
          { action_type: 'offsite_conversion.fb_pixel_purchase', value: '750000' },
        ],
      };
    }

    // Hitung metrik
    const spend = parseFloat(insightsData.spend) || 0;
    const impressions = parseFloat(insightsData.impressions) || 0;
    const clicks = parseFloat(insightsData.clicks) || 0;
    const ctr = parseFloat(insightsData.ctr) || 0;

    // Hitung ROAS (Revenue / Spend)
    const revenue = insightsData.action_values?.[0]?.value
      ? parseFloat(insightsData.action_values[0].value)
      : 750000;
    const roas = spend > 0 ? revenue / spend : 0;

    // Hitung Reach (dummy: impressions / 1000)
    const reach = impressions / 1000;

    // Send ke AI Service
    const aiResponse = await axios.post('http://localhost:5001/analyze', {
      ctr: ctr,
      roas: roas,
      reach: reach,
      spend: spend,
    });

    const { score, recommendations, label, color } = aiResponse.data;

    // Simpan/update AI recommendation ke database
    const aiRecommendation = await prisma.aiRecommendation.upsert({
      where: { campaignId: campaign.id },
      update: {
        score: score,
        recommendations: JSON.stringify(recommendations),
        label: label,
        color: color,
      },
      create: {
        campaignId: campaign.id,
        score: score,
        recommendations: JSON.stringify(recommendations),
        label: label,
        color: color,
      },
    });

    res.json({
      message: 'Kampanye berhasil dianalisis',
      data: {
        score: score,
        label: label,
        color: color,
        recommendations: recommendations,
        metrics: {
          ctr: ctr.toFixed(2),
          roas: roas.toFixed(2),
          reach: reach.toFixed(0),
          spend: spend,
        },
      },
    });
  } catch (error) {
    console.error('Analyze campaign error:', error);
    res.status(500).json({
      message: 'Gagal menganalisis kampanye',
      error: error.message,
    });
  }
};

// ===== GET CAMPAIGN RECOMMENDATIONS (NEW) =====
exports.getCampaignRecommendations = async (req, res) => {
  try {
    const { metaCampaignId } = req.params;
    const userId = req.user.id;

    // Ambil campaign dengan verifikasi kepemilikan
    const campaign = await prisma.campaign.findUnique({
      where: { metaCampaignId: metaCampaignId },
      include: {
        metaAccount: true,
        aiRecommendation: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Kampanye tidak ditemukan' });
    }

    if (campaign.metaAccount.userId !== userId) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke kampanye ini' });
    }

    // Jika belum ada AI recommendation, lakukan analisis otomatis
    let recommendation = campaign.aiRecommendation;

    if (!recommendation) {
      // Fetch insights
      let insightsData = null;
      try {
        const insightsResponse = await axios.get(
          `https://graph.facebook.com/v18.0/${metaCampaignId}/insights`,
          {
            params: {
              fields: 'spend,impressions,clicks,ctr,actions,action_values',
              time_range: {
                since: '2025-01-01',
                until: '2025-05-27',
              },
              access_token: campaign.metaAccount.accessToken,
            },
          }
        );
        insightsData = insightsResponse.data.data[0] || null;
      } catch (apiError) {
        console.warn('Meta API error:', apiError.message);
      }

      // Gunakan dummy data
      if (!insightsData) {
        insightsData = {
          spend: 150000,
          impressions: 45000,
          clicks: 1800,
          ctr: '2.5',
          actions: [{ action_type: 'offsite_conversion.fb_pixel_purchase', value: '12' }],
          action_values: [{ action_type: 'offsite_conversion.fb_pixel_purchase', value: '750000' }],
        };
      }

      // Hitung metrik
      const spend = parseFloat(insightsData.spend) || 0;
      const impressions = parseFloat(insightsData.impressions) || 0;
      const clicks = parseFloat(insightsData.clicks) || 0;
      const ctr = parseFloat(insightsData.ctr) || 0;
      const revenue = insightsData.action_values?.[0]?.value
        ? parseFloat(insightsData.action_values[0].value)
        : 750000;
      const roas = spend > 0 ? revenue / spend : 0;
      const reach = impressions / 1000;

      // Call AI Service
      const aiResponse = await axios.post('http://localhost:5001/analyze', {
        ctr: ctr,
        roas: roas,
        reach: reach,
        spend: spend,
      });

      const { score, recommendations, label, color } = aiResponse.data;

      // Simpan ke database
      recommendation = await prisma.aiRecommendation.create({
        data: {
          campaignId: campaign.id,
          score: score,
          recommendations: JSON.stringify(recommendations),
          label: label,
          color: color,
        },
      });
    }

    // Parse recommendations dari JSON string
    const parsedRecommendations = JSON.parse(recommendation.recommendations || '[]');

    // Transform ke format yang lebih readable
    const transformedRecommendations = parsedRecommendations.map((rec, index) => ({
      id: `rec-${index}`,
      title: rec.recommendation,
      description: `${rec.reason}. Tingkat prioritas: ${rec.priority === 'high' ? 'Tinggi - segera perbaiki' : rec.priority === 'medium' ? 'Sedang - rencanakan perbaikan' : 'Rendah - pertahankan atau optimalkan lebih lanjut'}`,
      priority: rec.priority,
      metrics: {
        'Metrik Terkait': rec.metric,
        'Nilai Saat Ini': rec.current_value,
        'Target': rec.threshold,
      },
    }));

    res.json({
      message: 'Rekomendasi kampanye berhasil diambil',
      data: {
        score: recommendation.score,
        name: campaign.name,
        label: recommendation.label,
        color: recommendation.color,
        recommendations: transformedRecommendations,
      },
    });
  } catch (error) {
    console.error('Get campaign recommendations error:', error);
    res.status(500).json({
      message: 'Gagal mengambil rekomendasi kampanye',
      error: error.message,
    });
  }
};