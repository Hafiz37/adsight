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

    if (!code) {
      return res.status(400).json({ message: 'Kode autentikasi tidak ditemukan' });
    }

    // Tukar kode dengan access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code: code,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).json({ message: 'Gagal mendapatkan access token dari Meta' });
    }

    // Ambil info akun menggunakan Facebook Graph API
    const accountResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,email',
        access_token: accessToken,
      },
    });

    const userName = accountResponse.data.name || 'Facebook User';

    // Ambil list Ad Accounts yang bisa diakses user
    let adAccounts = [];
    try {
      const adAccountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/adaccounts', {
        params: {
          fields: 'id,name,account_id',
          access_token: accessToken,
        },
      });
      adAccounts = adAccountsResponse.data.data || [];
    } catch (adError) {
      console.warn('Gagal mengambil list ad accounts:', adError.message);
    }

    // Jika user tidak punya ad account bisnis/lainnya, masukkan personal account-nya sebagai opsi
    if (adAccounts.length === 0) {
      adAccounts.push({
        id: `act_${accountResponse.data.id}`,
        name: `${userName} (Personal Ad Account)`,
        account_id: accountResponse.data.id,
      });
    }

    // Redirect ke frontend dengan data via URL fragment (aman dari server logs)
    const redirectUrl = `http://localhost:5173/dashboard#meta_connected=true&accessToken=${encodeURIComponent(accessToken)}&adAccounts=${encodeURIComponent(JSON.stringify(adAccounts))}&userName=${encodeURIComponent(userName)}`;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Menghubungkan Meta Ads...</title>
        <script>
          window.location.href = '${redirectUrl}';
        </script>
      </head>
      <body>
        <p>Menghubungkan akun Meta Ads Anda...</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Meta callback error:', error.response?.data || error.message);
    
    // Return error page yang user-friendly
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error Koneksi</title>
        <style>
          body { font-family: Arial; margin: 50px; }
          .error { color: red; }
        </style>
      </head>
      <body>
        <h1 class="error">⚠️ Gagal Menghubungkan Meta Ads</h1>
        <p>${error.response?.data?.error_description || error.message}</p>
        <button onclick="window.location.href='http://localhost:5173/dashboard'">
          Kembali ke Dashboard
        </button>
      </body>
      </html>
    `);
  }
};

// ===== SAVE META CONNECTION (NEW) =====
// Endpoint baru untuk menyimpan koneksi Meta yang sudah disimpan di localStorage
exports.saveMetaConnection = async (req, res) => {
  try {
    const userId = req.user.userId; // Dari verifyToken middleware
    const { accessToken, accountId, accountName } = req.body;

    if (!accessToken || !accountId) {
      return res.status(400).json({ message: 'Data Meta Ads tidak lengkap' });
    }

    // Simpan ke database
    const metaAccount = await prisma.metaAccount.upsert({
      where: {
        userId_accountId: {
          userId: userId,
          accountId: String(accountId),
        },
      },
      update: {
        accessToken: accessToken,
        accountName: accountName,
      },
      create: {
        userId: userId,
        accountId: String(accountId),
        accessToken: accessToken,
        accountName: accountName,
      },
    });

    // Hapus dari localStorage di frontend
    res.json({
      message: 'Akun Meta Ads berhasil terhubung',
      data: metaAccount,
    });
  } catch (error) {
    console.error('Save meta connection error:', error);
    res.status(500).json({
      message: 'Gagal menyimpan koneksi Meta Ads',
      error: error.message,
    });
  }
};

// ===== GET CAMPAIGNS =====
exports.getCampaigns = async (req, res) => {
  try {
    // Pastikan req.user.id ada (cek di authController saat login/sign token)
    const userId = req.user.userId;

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
            fields: 'id,name,status,created_time,insights.date_preset(last_30d){spend,impressions,clicks,ctr,reach,actions,action_values}',
            access_token: metaAccount.accessToken,
          },
        }
      );

      const campaignsFromApi = insightsResponse.data.data || [];

      // 3. Simpan/update campaigns ke database
      for (const campaign of campaignsFromApi) {
        const insight = campaign.insights?.data?.[0] || {};
        const rawSpend = parseFloat(insight.spend) || 0;
        const rawImpressions = parseFloat(insight.impressions) || 0;
        const rawClicks = parseFloat(insight.clicks) || 0;
        const rawCtr = parseFloat(insight.ctr) || 0;
        const rawReach = parseInt(insight.reach) || Math.round(rawImpressions / 1000);
        const purchaseValue = (insight.action_values || []).find(
          av => av.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        const rawRevenue = purchaseValue ? parseFloat(purchaseValue.value) : 0;
        const rawRoas = rawSpend > 0 ? rawRevenue / rawSpend : 0;
        const campaignDate = campaign.created_time ? new Date(campaign.created_time) : new Date();

        await prisma.campaign.upsert({
          where: {
            metaAccountId_metaCampaignId: {
              metaAccountId: metaAccount.id,
              metaCampaignId: campaign.id,
            },
          },
          update: {
            name: campaign.name,
            status: campaign.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE',
            spend: rawSpend,
            ctr: rawCtr,
            roas: rawRoas,
            reach: rawReach,
            date: campaignDate,
          },
          create: {
            metaAccountId: metaAccount.id,
            metaCampaignId: campaign.id,
            name: campaign.name,
            status: campaign.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE',
            spend: rawSpend,
            ctr: rawCtr,
            roas: rawRoas,
            reach: rawReach,
            date: campaignDate,
          },
        });
      }
    } catch (apiError) {
      console.warn('Meta API error atau data kosong:', apiError.response?.data || apiError.message);
    }

    // 4. Ambil campaigns dari database (urutkan dari terbaru)
    const campaigns = await prisma.campaign.findMany({
      where: {
        metaAccount: {
          userId: userId,
        },
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        id: true,
        metaCampaignId: true,
        name: true,
        status: true,
        spend: true,
        reach: true,
        createdAt: true,
      },
    });

    res.json({
      message: 'Kampanye berhasil diambil',
      campaigns: campaigns,
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
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    const campaign = await prisma.campaign.findFirst({
      where: { metaCampaignId, metaAccount: { userId } },
      include: { metaAccount: true },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Kampanye tidak ditemukan' });
    }

    const isPaused = campaign.status === 'PAUSED';
    const hasDateFilter = !!(startDate && endDate);

    // PAUSED tanpa filter tanggal → langsung return paused
    if (isPaused && !hasDateFilter) {
      return res.json({
        message: 'Kampanye sedang paused. Gunakan filter tanggal untuk melihat data historis.',
        data: { metaCampaignId, name: campaign.name, status: campaign.status, paused: true, insights: null },
      });
    }

    // Tentukan time range — selalu real-time dari Meta API
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const timeRange = hasDateFilter
      ? { since: startDate, until: endDate }
      : { since: start.toISOString().split('T')[0], until: end.toISOString().split('T')[0] };

    let insightsData = null;
    let metaError = null;
    try {
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${metaCampaignId}/insights`,
        {
          params: {
          fields: 'spend,impressions,clicks,ctr,reach,actions,action_values',
          time_range: timeRange,
          access_token: campaign.metaAccount.accessToken,
          },
        }
      );
      insightsData = insightsResponse.data.data[0] || null;
    } catch (apiError) {
      metaError = apiError.response?.data?.error?.message || apiError.message;
      console.warn('Meta API insights error:', metaError);
    }

    // Jika Meta API gagal/tidak ada data, return error — tidak pakai fallback DB
    if (!insightsData) {
      return res.json({
        message: metaError || 'Tidak ada data dari Meta Ads untuk periode ini',
        data: { metaCampaignId, name: campaign.name, status: campaign.status, paused: isPaused, insights: null, metaError },
      });
    }

    const rawSpend = parseFloat(insightsData.spend) || 0;
    const rawImpressions = parseFloat(insightsData.impressions) || 0;
    const rawCtr = parseFloat(insightsData.ctr) || 0;
    const rawReach = parseInt(insightsData.reach) || Math.round(rawImpressions / 1000);
    const purchaseValue = (insightsData.action_values || []).find(
      av => av.action_type === 'offsite_conversion.fb_pixel_purchase'
    );
    const rawRevenue = purchaseValue ? parseFloat(purchaseValue.value) : 0;
    const roas = rawSpend > 0 ? rawRevenue / rawSpend : 0;

    res.json({
      message: 'Data insights dari Meta Ads',
      data: {
        metaCampaignId,
        name: campaign.name,
        status: campaign.status,
        insights: { spend: rawSpend, impressions: rawImpressions, ctr: rawCtr, roas: roas, reach: rawReach },
      },
    });
  } catch (error) {
    console.error('Get campaign insights error:', error);
    res.status(500).json({ message: 'Gagal mengambil insights kampanye', error: error.message });
  }
};

// ===== ANALYZE CAMPAIGN (Trigger AI) =====
exports.analyzeCampaign = async (req, res) => {
  try {
    const { metaCampaignId } = req.params;
    const userId = req.user.userId;

    const campaign = await prisma.campaign.findFirst({
      where: { metaCampaignId, metaAccount: { userId } },
      include: { metaAccount: true },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Kampanye tidak ditemukan' });
    }

    // Fetch insights dari Meta API
    let insightsData = null;
    let usingDummy = false;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    try {
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${metaCampaignId}/insights`,
        {
          params: {
            fields: 'spend,impressions,clicks,ctr,reach,actions,action_values',
            time_range: { since: start.toISOString().split('T')[0], until: end.toISOString().split('T')[0] },
            access_token: campaign.metaAccount.accessToken,
          },
        }
      );

      insightsData = insightsResponse.data.data[0] || null;
    } catch (apiError) {
      console.warn('Meta API error:', apiError.message);
    }

    if (!insightsData) {
      if (campaign.spend > 0) {
        insightsData = {
          spend: campaign.spend,
          impressions: 0,
          clicks: 0,
          ctr: campaign.ctr,
          reach: campaign.reach,
          actions: [],
          action_values: [],
        };
        usingDummy = true;
      } else {
        return res.status(400).json({ message: 'Meta API tidak dapat dijangkau dan tidak ada data tersimpan untuk kampanye ini.', usingDummy });
      }
    }

    // Hitung metrik
    const spend = parseFloat(insightsData.spend) || 0;
    const impressions = parseFloat(insightsData.impressions) || 0;
    const clicks = parseFloat(insightsData.clicks) || 0;
    const ctr = parseFloat(insightsData.ctr) || 0;
    const reach = parseInt(insightsData.reach) || Math.round(impressions / 1000);

    // Hitung ROAS (Revenue / Spend)
    const purchaseValue = (insightsData.action_values || []).find(
      av => av.action_type === 'offsite_conversion.fb_pixel_purchase'
    );
    const revenue = purchaseValue ? parseFloat(purchaseValue.value) : 0;
    const roas = spend > 0 ? revenue / spend : 0;

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
        recommendations: recommendations,
        label: label,
        color: color,
      },
      create: {
        campaignId: campaign.id,
        score: score,
        recommendations: recommendations,
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
    const userId = req.user.userId;

    const campaign = await prisma.campaign.findFirst({
      where: { metaCampaignId, metaAccount: { userId } },
      include: { metaAccount: true, aiRecommendation: true },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Kampanye tidak ditemukan' });
    }

    // Jika belum ada AI recommendation, lakukan analisis otomatis
    let recommendation = campaign.aiRecommendation;

    if (!recommendation) {
      // Fetch insights
      let insightsData = null;
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      try {
        const insightsResponse = await axios.get(
          `https://graph.facebook.com/v18.0/${metaCampaignId}/insights`,
          {
            params: {
            fields: 'spend,impressions,clicks,ctr,reach,actions,action_values',
              time_range: { since: start.toISOString().split('T')[0], until: end.toISOString().split('T')[0] },
              access_token: campaign.metaAccount.accessToken,
            },
          }
        );
        insightsData = insightsResponse.data.data[0] || null;
      } catch (apiError) {
        console.warn('Meta API error:', apiError.message);
      }

      if (!insightsData && campaign.spend > 0) {
        insightsData = {
          spend: campaign.spend,
          impressions: 0,
          clicks: 0,
          ctr: campaign.ctr,
          reach: campaign.reach,
          actions: [],
          action_values: [],
        };
      }

      if (!insightsData) {
        return res.status(400).json({
          message: 'Meta API tidak dapat dijangkau dan tidak ada data tersimpan untuk kampanye ini. Silakan jalankan analisis secara manual setelah kampanye memiliki data.'
        });
      }

      // Hitung metrik
      const spend = parseFloat(insightsData.spend) || 0;
      const impressions = parseFloat(insightsData.impressions) || 0;
      const clicks = parseFloat(insightsData.clicks) || 0;
      const ctr = parseFloat(insightsData.ctr) || 0;
      const reach = parseInt(insightsData.reach) || Math.round(impressions / 1000);
      const purchaseValue = (insightsData.action_values || []).find(
        av => av.action_type === 'offsite_conversion.fb_pixel_purchase'
      );
      const revenue = purchaseValue ? parseFloat(purchaseValue.value) : 0;
      const roas = spend > 0 ? revenue / spend : 0;

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
          recommendations: recommendations,
          label: label,
          color: color,
        },
      });
    }

    // Parse recommendations (handle both string and pre-parsed array)
    let parsedRecommendations = recommendation.recommendations;
    if (typeof parsedRecommendations === 'string') {
      parsedRecommendations = JSON.parse(parsedRecommendations || '[]');
    }

    // Transform ke format yang lebih readable
    const transformedRecommendations = parsedRecommendations.map((rec, index) => ({
      id: `rec-${index}`,
      title: rec.message || rec.recommendation,
      category: rec.category,
      description: rec.impact
        ? `${rec.impact}\n\nLangkah-langkah yang bisa dilakukan:\n${rec.action}`
        : `${rec.priority === 'high' ? 'Segera perbaiki' : rec.priority === 'medium' ? 'Rencanakan perbaikan' : 'Pertahankan atau optimalkan lebih lanjut'}.`,
      priority: rec.priority,
      metrics: {
        'Metrik': rec.metric,
        'Nilai Saat Ini': rec.current_value,
        'Target Ideal': rec.threshold,
      },
    }));

    res.json({
      message: 'Rekomendasi kampanye berhasil diambil',
      data: {
        score: recommendation.score,
        campaignName: campaign.name,
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

// ===== DISCONNECT META ACCOUNT (NEW) =====
exports.disconnectMeta = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Hapus semua meta account milik user ini (akan cascade delete campaigns & recommendations)
    const deleteResult = await prisma.metaAccount.deleteMany({
      where: {
        userId: userId,
      },
    });

    res.json({
      message: 'Koneksi akun Meta Ads berhasil diputuskan',
      count: deleteResult.count,
    });
  } catch (error) {
    console.error('Disconnect Meta error:', error);
    res.status(500).json({
      message: 'Gagal memutuskan koneksi akun Meta Ads',
      error: error.message,
    });
  }
};

// ===== GET CAMPAIGN INSIGHTS HISTORY (daily breakdown untuk grafik) =====
exports.getCampaignInsightsHistory = async (req, res) => {
  try {
    const { metaCampaignId } = req.params;
    const userId = req.user.userId;
    let { startDate, endDate } = req.query;

    const campaign = await prisma.campaign.findFirst({
      where: { metaCampaignId, metaAccount: { userId } },
      include: { metaAccount: true },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Kampanye tidak ditemukan' });
    }

    // Default: 7 hari terakhir
    if (!startDate || !endDate) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }

    let dailyData = [];
    let metaError = null;

    // Tahap 1: daily breakdown
    try {
      const resp = await axios.get(`https://graph.facebook.com/v18.0/${metaCampaignId}/insights`, {
        params: {
          fields: 'spend,impressions,clicks,ctr,reach,actions,action_values',
          time_range: { since: startDate, until: endDate },
          time_increment: 1,
          access_token: campaign.metaAccount.accessToken,
        },
      });

      const rows = resp.data.data || [];
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

      for (const row of rows) {
        const spend = parseFloat(row.spend) || 0;
        const impressions = parseFloat(row.impressions) || 0;
        const ctr = parseFloat(row.ctr) || 0;
        const purchaseValue = (row.action_values || []).find(
          av => av.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        const revenue = purchaseValue ? parseFloat(purchaseValue.value) : 0;
        const roas = spend > 0 ? revenue / spend : 0;

        dailyData.push({
          day: dayNames[new Date(row.date_start).getDay()],
          date: row.date_start,
          spend: Math.round(spend),
          ctr: parseFloat(ctr.toFixed(2)),
          roas: parseFloat(roas.toFixed(2)),
        });
      }
    } catch (apiError) {
      metaError = apiError.response?.data?.error?.message || apiError.message;
      console.warn('Meta API daily breakdown error:', metaError);
    }

    // Tahap 2: jika daily kosong, coba aggregate
    if (dailyData.length === 0) {
      try {
        const aggResp = await axios.get(`https://graph.facebook.com/v18.0/${metaCampaignId}/insights`, {
          params: {
            fields: 'spend,impressions,clicks,ctr,reach,actions,action_values',
            time_range: { since: startDate, until: endDate },
            access_token: campaign.metaAccount.accessToken,
          },
        });

        const agg = aggResp.data.data?.[0];
        if (agg && parseFloat(agg.spend) > 0) {
          const totalSpend = parseFloat(agg.spend) || 0;
          const avgCtr = parseFloat(agg.ctr) || 0;
          const purchaseValue = (agg.action_values || []).find(
            av => av.action_type === 'offsite_conversion.fb_pixel_purchase'
          );
          const revenue = purchaseValue ? parseFloat(purchaseValue.value) : 0;
          const avgRoas = totalSpend > 0 ? revenue / totalSpend : 0;

          const start = new Date(startDate);
          const end = new Date(endDate);
          const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
          const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dailyData.push({
              day: dayNames[d.getDay()],
              date: d.toISOString().split('T')[0],
              spend: Math.round(totalSpend / totalDays),
              ctr: avgCtr,
              roas: avgRoas,
            });
          }
          metaError = null;
        }
      } catch (aggError) {
        if (!metaError) metaError = aggError.response?.data?.error?.message || aggError.message;
        console.warn('Meta API aggregate error:', metaError);
      }
    }

    dailyData.sort((a, b) => a.date.localeCompare(b.date));

    const isPaused = campaign.status === 'PAUSED';

    res.json({
      message: dailyData.length > 0
        ? 'Data history dari Meta Ads'
        : isPaused
          ? 'Kampanye sedang Paused — tidak ada data untuk periode ini.'
          : metaError || 'Tidak ada data untuk periode yang dipilih',
      history: dailyData,
      metaError: dailyData.length === 0 ? metaError : null,
      paused: dailyData.length === 0 && isPaused,
    });
  } catch (error) {
    console.error('Get campaign insights history error:', error);
    res.status(500).json({ message: 'Gagal mengambil data history kampanye', error: error.message });
  }
};

// ===== GET CONNECTED ACCOUNT (NEW) =====
exports.getConnectedAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const metaAccount = await prisma.metaAccount.findFirst({
      where: { userId: userId },
      select: {
        id: true,
        accountId: true,
        accountName: true,
        createdAt: true,
      },
    });

    if (!metaAccount) {
      return res.status(404).json({
        message: 'Belum ada akun Meta Ads yang terhubung',
      });
    }

    res.json({
      message: 'Akun Meta Ads berhasil diambil',
      account: metaAccount,
    });
  } catch (error) {
    console.error('Get connected account error:', error);
    res.status(500).json({
      message: 'Gagal mengambil akun Meta Ads',
      error: error.message,
    });
  }
};