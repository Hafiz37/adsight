// frontend/src/components/PageAI.jsx
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ScoreGauge from './ScoreGauge'
import RecommendationCard from './RecommendationCard'

export default function PageAI({ activeCampaignId, campaigns, onSelectCampaign }) {
  const [score, setScore] = useState(0)
  const [recommendations, setRecommendations] = useState([])
  const [campaignName, setCampaignName] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const token = localStorage.getItem('token')
  const apiUrl = 'http://localhost:5000/api'

  const fetchRecommendations = async (id) => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(
        `${apiUrl}/meta/campaigns/${id}/recommendations`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = response.data.data
      setScore(data.score || 0)
      setCampaignName(data.campaignName || 'Kampanye')
      setRecommendations(data.recommendations || [])
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError(err.response?.data?.message || 'Belum ada rekomendasi tersimpan untuk kampanye ini. Silakan klik tombol "Analisis Sekarang" di bawah.')
      setScore(0)
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeCampaignId) {
      const activeCamp = campaigns.find(c => c.metaCampaignId === activeCampaignId)
      if (activeCamp) {
        setCampaignName(activeCamp.name)
      }
      fetchRecommendations(activeCampaignId)
    }
  }, [activeCampaignId, campaigns])

  const handleAnalyze = async () => {
    if (!activeCampaignId) return
    try {
      setAnalyzing(true)
      setError(null)

      // 1. Trigger Analisis AI
      await axios.post(
        `${apiUrl}/meta/campaigns/${activeCampaignId}/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // 2. Refresh data
      await fetchRecommendations(activeCampaignId)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menganalisis kampanye.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Jika tidak ada kampanye terpilih sama sekali
  if (!activeCampaignId && campaigns.length > 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12 space-y-6">
        <div className="w-16 h-16 bg-violet-600/10 text-violet-400 rounded-full flex items-center justify-center mx-auto text-3xl">
          ⚡
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Pilih Kampanye</h3>
          <p className="text-gray-400 text-sm">
            Silakan pilih kampanye Meta Ads Anda terlebih dahulu untuk memulai analisis rekomendasi AI yang cerdas.
          </p>
        </div>
        <div>
          <select
            onChange={(e) => onSelectCampaign(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 focus:border-violet-500 rounded-xl py-3 px-4 text-sm text-gray-200 focus:outline-none transition-all"
          >
            <option value="">Pilih kampanye...</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.metaCampaignId}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }

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
          <h2 className="text-2xl font-bold text-white">Rekomendasi AI</h2>
          <p className="text-gray-400 text-sm mt-1">
            Kampanye: <span className="text-violet-400 font-semibold">{campaignName || 'Memuat...'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={activeCampaignId}
            onChange={(e) => onSelectCampaign(e.target.value)}
            className="bg-gray-900 border border-gray-850 hover:border-gray-700 text-sm text-gray-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.metaCampaignId}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || loading}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-gray-800 text-white font-semibold transition-all text-sm flex items-center gap-2 shadow-lg shadow-violet-600/20"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Menganalisis...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Analisis Ulang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl text-red-200 text-sm flex items-start gap-3">
          <span className="text-base mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold">Info Analisis</p>
            <p className="text-red-300/80 mt-1">{error}</p>
            {error.includes('Belum ada rekomendasi') && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="mt-3 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-all"
              >
                Analisis Sekarang
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-gray-800 border-t-violet-500 rounded-full mb-3"></div>
          <p className="text-gray-400 text-sm">Mengambil rekomendasi AI...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Gauge Column */}
          <div className="lg:col-span-1 bg-gray-900 border border-gray-850 rounded-2xl p-6">
            <ScoreGauge score={score} />
          </div>

          {/* Cards Column */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📋</span> Daftar Optimasi ({recommendations.length})
            </h3>
            {recommendations.length > 0 ? (
              recommendations.map((rec) => (
                <RecommendationCard 
                  key={rec.id} 
                  recommendation={rec} 
                  onAnalyzeAgain={handleAnalyze}
                />
              ))
            ) : (
              <div className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl p-12 text-center text-gray-500">
                Belum ada rekomendasi optimasi aktif.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
