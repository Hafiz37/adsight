// frontend/src/components/PageCampaigns.jsx
import React, { useState } from 'react'

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

export default function PageCampaigns({ campaigns, isLoading, onSelectCampaign, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.metaCampaignId.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Manajemen Kampanye</h2>
        <p className="text-gray-400 text-sm mt-1">Kelola dan pilih kampanye aktif Anda untuk dianalisis</p>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-900/50 p-4 rounded-xl border border-gray-800">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari kampanye..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 focus:border-violet-500 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition-all"
          />
        </div>
        <div className="text-xs text-gray-400 font-medium">
          Menampilkan <span className="text-violet-400 font-bold">{filteredCampaigns.length}</span> dari {campaigns.length} kampanye
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="bg-gray-900 border border-gray-850 rounded-xl p-6 space-y-4 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="h-3 bg-gray-800 rounded w-1/2"></div>
              <div className="flex gap-2 pt-4">
                <div className="h-9 bg-gray-800 rounded flex-1"></div>
                <div className="h-9 bg-gray-800 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-gray-400 font-medium">Tidak ada kampanye yang cocok</p>
          <p className="text-gray-600 text-sm mt-1">Coba kata kunci pencarian lain atau sinkronkan kembali akun Meta Ads Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCampaigns.map((campaign) => {
            const isActive = campaign.status === 'ACTIVE'
            return (
              <div 
                key={campaign.id} 
                className="bg-gray-900 border border-gray-850 hover:border-gray-700/80 rounded-xl p-6 flex flex-col justify-between transition-all duration-200 group"
              >
                <div>
                  {/* Status & Name */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-bold text-white group-hover:text-violet-400 transition-colors text-base line-clamp-2">
                      {campaign.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      isActive 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>

                  {/* ID */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                    <span>ID: {campaign.metaCampaignId}</span>
                    <button 
                      onClick={() => handleCopy(campaign.metaCampaignId)} 
                      className="hover:text-gray-300 transition-colors p-1"
                      title="Salin ID Kampanye"
                    >
                      {copiedId === campaign.metaCampaignId ? <IconCheck /> : <IconCopy />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-gray-850 pt-4 mt-auto">
                  <button
                    onClick={() => {
                      onSelectCampaign(campaign.metaCampaignId)
                      onNavigate('dashboard')
                    }}
                    className="flex-1 bg-gray-800/80 hover:bg-gray-850 border border-gray-750 text-gray-300 hover:text-white py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center"
                  >
                    📊 Dashboard
                  </button>
                  <button
                    onClick={() => {
                      onSelectCampaign(campaign.metaCampaignId)
                      onNavigate('ai')
                    }}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center shadow-md shadow-violet-600/10 hover:shadow-violet-600/20"
                  >
                    ⚡ Rekomendasi AI
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
