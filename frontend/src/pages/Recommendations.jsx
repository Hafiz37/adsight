import React, { useState, useEffect } from 'react'; // Hapus useCallback jika tidak dipakai lagi
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ScoreGauge from '../components/ScoreGauge';
import RecommendationCard from '../components/RecommendationCard';
import ExportPDFButton from '../components/ExportPDFButton';

const Recommendations = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');

  // --- STATE INITIALIZATION ---
  const [score, setScore] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [campaignName, setCampaignName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState(null);

  // Inisialisasi loading dan error berdasarkan campaignId
  const [loading, setLoading] = useState(!!campaignId);
  const [error, setError] = useState(
    !campaignId ? 'Campaign ID tidak ditemukan. Silakan pilih kampanye dari dashboard.' : null
  );

  const token = localStorage.getItem('token');
  const apiUrl = 'http://localhost:5000/api';

  // --- EFFECTS ---
  useEffect(() => {
    // Kita buat fungsi di dalam useEffect agar linter bisa melacak alur asinkronnya
    const getRecommendations = async () => {
      if (!campaignId) return;

      try {
        // PERHATIKAN: Tidak ada setState(true) di sini untuk menghindari error "synchronous"
        const response = await axios.get(
          `${apiUrl}/meta/campaigns/${campaignId}/recommendations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = response.data.data;
        setScore(data.score || 0);
        setCampaignName(data.campaignName || 'Kampanye');
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.error('Error:', err);
        setError(err.response?.data?.message || 'Gagal memuat rekomendasi.');
      } finally {
        setLoading(false);
      }
    };

    getRecommendations();
  }, [campaignId, token, apiUrl]); // Dependencies yang diperlukan

  // Fetch insights untuk data metrik (dipakai Export PDF)
  useEffect(() => {
    const fetchInsights = async () => {
      if (!campaignId) return;
      try {
        const response = await axios.get(
          `${apiUrl}/meta/campaigns/${campaignId}/insights`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const insights = response.data?.data?.insights;
        if (insights) {
          setMetrics({
            spend: insights.spend || 0,
            ctr: insights.ctr || 0,
            roas: insights.roas || 0,
            reach: insights.reach || 0,
          });
        }
      } catch (err) {
        console.error('Error fetching insights for PDF:', err);
      }
    };
    fetchInsights();
  }, [campaignId, token, apiUrl]);

  // --- HANDLERS ---
  const handleAnalyzeAgain = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      // 1. Jalankan Analisis
      await axios.post(
        `${apiUrl}/meta/campaigns/${campaignId}/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Ambil data terbaru (Fetch ulang)
      // Karena kita butuh fetch ulang di sini, kita bisa buat fungsi kecil 
      // atau memicu re-render dengan state (tapi cara termudah adalah fetch langsung)
      const response = await axios.get(
        `${apiUrl}/meta/campaigns/${campaignId}/recommendations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data.data;
      setScore(data.score || 0);
      setRecommendations(data.recommendations || []);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menganalisis kampanye.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBackToDashboard = () => navigate('/dashboard');

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-white mb-2">AdSight</h1>
        <p className="text-gray-400 text-xs mb-12">Konsultan Virtual</p>
        <nav className="space-y-4 flex-1">
          <button onClick={handleBackToDashboard} className="w-full text-left px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors">
            📊 Dashboard
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg bg-violet-600 text-white font-semibold transition-colors">
            ⚡ Rekomendasi
          </button>
        </nav>
        <div className="border-t border-gray-800 pt-4">
          <button
            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}
            className="w-full px-4 py-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 font-semibold transition-colors text-sm"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Analisis Rekomendasi</h2>
          <p className="text-gray-400">Kampanye: <span className="text-violet-400 font-semibold">{campaignName}</span></p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-200">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin w-12 h-12 border-4 border-gray-700 border-t-violet-500 rounded-full mb-4"></div>
              <p className="text-gray-400">Memuat...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 sticky top-8">
                <ScoreGauge score={score} />
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Rekomendasi ({recommendations.length})</h3>
                  <div className="flex items-center gap-3">
                    <ExportPDFButton
                      metrics={metrics}
                      score={score}
                      recommendations={recommendations}
                      campaignName={campaignName}
                      variant="ghost"
                      size="md"
                    />
                    <button
                      onClick={handleAnalyzeAgain}
                      disabled={analyzing}
                      className="px-6 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white font-semibold transition-all text-sm"
                    >
                      {analyzing ? "Menganalisis..." : "🔄 Analisis Ulang"}
                    </button>
                  </div>
                </div>

                {recommendations.length > 0 ? (
                  recommendations.map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))
                ) : (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
                    Belum ada rekomendasi.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;