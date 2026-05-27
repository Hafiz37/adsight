// frontend/src/components/PageReport.jsx
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ExportPDFButton from './ExportPDFButton'

export default function PageReport({ activeCampaignId, campaigns, onSelectCampaign }) {
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [score, setScore] = useState(0)
  const [recommendations, setRecommendations] = useState([])
  const [campaignName, setCampaignName] = useState('')
  const [error, setError] = useState(null)

  const token = localStorage.getItem('token')
  const apiUrl = 'http://localhost:5000/api'

  useEffect(() => {
    const fetchAllData = async () => {
      if (!activeCampaignId) return
      setLoading(true)
      setError(null)
      try {
        const activeCamp = campaigns.find(c => c.metaCampaignId === activeCampaignId)
        setCampaignName(activeCamp?.name || 'Kampanye')

        // 1. Fetch Insights
        const insightsRes = await axios.get(
          `${apiUrl}/meta/campaigns/${activeCampaignId}/insights`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const insights = insightsRes.data.insights
        if (insights) {
          setMetrics({
            spend: insights.spend || 0,
            ctr: insights.ctr || 0,
            roas: insights.roas || 0,
            reach: insights.reach || 0,
          })
        } else {
          setMetrics(null)
        }

        // 2. Fetch Recommendations
        try {
          const recRes = await axios.get(
            `${apiUrl}/meta/campaigns/${activeCampaignId}/recommendations`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          const recData = recRes.data.data
          setScore(recData.score || 0)
          setRecommendations(recData.recommendations || [])
        } catch (recErr) {
          // Jika rekomendasi belum di-generate, abaikan atau set default
          setScore(0)
          setRecommendations([])
        }

      } catch (err) {
        console.error('Error fetching report data:', err)
        setError('Gagal memuat data laporan untuk kampanye ini.')
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [activeCampaignId, campaigns])

  if (campaigns.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12 space-y-4">
        <div className="text-4xl">⚠️</div>
        <h3 className="text-xl font-bold text-white">Akun Meta Belum Terkoneksi</h3>
        <p className="text-gray-400 text-sm">
          Harap hubungkan akun Meta Ads Anda terlebih dahulu di Dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Laporan PDF</h2>
          <p className="text-gray-400 text-sm mt-1">
            Ekspor ringkasan performa dan rekomendasi optimasi ke dalam format PDF premium
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={activeCampaignId}
            onChange={(e) => onSelectCampaign(e.target.value)}
            className="bg-gray-900 border border-gray-850 hover:border-gray-700 text-sm text-gray-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="">Pilih kampanye...</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.metaCampaignId}>
                {c.name}
              </option>
            ))}
          </select>
          {activeCampaignId && !loading && (
            <ExportPDFButton
              metrics={metrics}
              score={score}
              recommendations={recommendations}
              campaignName={campaignName}
              variant="primary"
              size="md"
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-gray-800 border-t-violet-500 rounded-full mb-3"></div>
          <p className="text-gray-400 text-sm">Mempersiapkan data laporan...</p>
        </div>
      ) : !activeCampaignId ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center max-w-lg mx-auto mt-6">
          <p className="text-gray-400 font-medium">Pilih Kampanye</p>
          <p className="text-gray-600 text-sm mt-1">Pilih kampanye pada dropdown di atas untuk melihat preview laporan.</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info & Tips */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-900 border border-gray-850 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base">Detail Dokumen</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between border-b border-gray-850 pb-2">
                  <span className="text-gray-500">Nama File</span>
                  <span className="font-medium truncate max-w-[150px]" title={`adshight-report-${new Date().toISOString().split('T')[0]}.pdf`}>
                    adshight-report-...pdf
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-2">
                  <span className="text-gray-500">Format</span>
                  <span className="font-medium">A4 (Portrait)</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-2">
                  <span className="text-gray-500">Rekomendasi</span>
                  <span className="font-medium">{recommendations.length} Butir</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-500">Skor Kesehatan</span>
                  <span className={`font-bold ${score < 40 ? 'text-red-400' : score < 70 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {score}/100
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-950/40 to-gray-900 border border-violet-900/20 rounded-2xl p-6 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>💡</span> Tips Berbagi Laporan
              </h3>
              <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                <li>Gunakan laporan PDF ini untuk dipresentasikan ke klien atau pemilik bisnis.</li>
                <li>Data performa iklan telah disederhanakan agar mudah dipahami oleh pemula.</li>
                <li>Ekspor ulang laporan setelah Anda menerapkan perubahan rekomendasi AI agar bisa melihat progres peningkatan skor kesehatan iklan.</li>
              </ul>
            </div>
          </div>

          {/* Interactive Mini Preview */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-850 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Preview Laporan</h3>
            
            {/* Visual mini-report mockup */}
            <div className="border border-gray-800 rounded-xl p-6 bg-gray-950/80 space-y-6 select-none pointer-events-none">
              {/* Header Mockup */}
              <div className="flex justify-between items-center border-b border-gray-900 pb-4">
                <div>
                  <div className="text-sm font-bold text-white">Ad<span className="text-violet-400">Sight</span></div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-0.5">Laporan Performa Iklan</div>
                </div>
                <div className="text-right text-[9px] text-gray-500">
                  <div>{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Campaign Info Mockup */}
              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-850">
                <div className="text-[8px] text-gray-500 uppercase">Kampanye</div>
                <div className="text-xs font-bold text-violet-400 mt-0.5 truncate">{campaignName}</div>
              </div>

              {/* Metrics Mockup */}
              <div className="grid grid-cols-4 gap-2">
                {['Spend', 'CTR', 'ROAS', 'Reach'].map((m) => (
                  <div key={m} className="bg-gray-900/40 p-2.5 rounded-lg border border-gray-850/80">
                    <div className="text-[8px] text-gray-600 uppercase">{m}</div>
                    <div className="text-xs font-extrabold text-gray-200 mt-1">
                      {m === 'Spend' && (metrics?.spend ? `${Math.round(metrics.spend/1000)}k` : '-')}
                      {m === 'CTR' && (metrics?.ctr ? `${metrics.ctr.toFixed(2)}%` : '-')}
                      {m === 'ROAS' && (metrics?.roas ? `${metrics.roas.toFixed(1)}x` : '-')}
                      {m === 'Reach' && (metrics?.reach ? `${Math.round(metrics.reach/1000)}k` : '-')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Score Mockup */}
              <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-850/80 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full border-4 ${
                  score < 40 ? 'border-red-500 text-red-400' : score < 70 ? 'border-yellow-500 text-yellow-400' : 'border-green-500 text-green-400'
                } flex items-center justify-center font-extrabold text-sm bg-gray-950`}>
                  {Math.round(score)}
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-200">Skor Kesehatan Iklan</div>
                  <div className="text-[9px] text-gray-500">Menunjukkan seberapa efisien performa iklan Anda</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <ExportPDFButton
                metrics={metrics}
                score={score}
                recommendations={recommendations}
                campaignName={campaignName}
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
