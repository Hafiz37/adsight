// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import PerformanceChart from '../components/PerformanceChart'
import FilterBar from '../components/FilterBar'
import ConnectMetaModal from '../components/ConnectMetaModal'
import { ErrorAlert, WarningAlert } from '../components/ErrorAlert'
import { LoadingState, SkeletonCard, SkeletonChart } from '../components/LoadingSpinner'
import { useFetchCampaigns, useFetchInsights, useCheckMetaConnection } from '../hooks/useFetchInsights'

// Icons
const IconDashboard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
const IconCampaign = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
const IconAI = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" /></svg>
const IconReport = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
const IconLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
const IconMenu = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
const IconSpend = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" /></svg>
const IconCTR = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19H3V7a2 2 0 0 1 2-2h2" /><path d="M22 16a6 6 0 0 1-9.39-5.46" /></svg>
const IconROAS = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
const IconReach = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { id: 'campaigns', label: 'Kampanye', icon: <IconCampaign /> },
  { id: 'ai', label: 'Rekomendasi AI', icon: <IconAI /> },
  { id: 'report', label: 'Laporan', icon: <IconReport /> },
]

// Sidebar
function Sidebar({ activePage, onNavigate, onLogout, user, isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-64 z-30 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Ad<span className="text-violet-400">Sight</span></h1>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white"><IconClose /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id
            return (
              <button key={item.id} onClick={() => { onNavigate(item.id); onClose() }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${isActive ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <span>{item.icon}</span>
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </button>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          <div className="px-4 py-3 rounded-lg bg-gray-800/60 mb-2">
            <p className="text-xs text-gray-500 mb-0.5">Login sebagai</p>
            <p className="text-sm text-gray-200 font-medium truncate">{user?.email || '-'}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">{user?.role || 'USER'}</span>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <IconLogout />
            Keluar
          </button>
        </div>
      </aside>
    </>
  )
}

// PageDashboard (DIUBAH)
function PageDashboard({ onOpenConnectModal }) {
  const { campaigns, isLoading: campaignsLoading, error: campaignsError } = useFetchCampaigns()
  const { isConnected, isLoading: connectionLoading } = useCheckMetaConnection()
  
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  
  // Menggunakan Derived State untuk auto-select kampanye pertama
  const activeCampaignId = selectedCampaignId || (campaigns.length > 0 ? campaigns[0].metaCampaignId : '')

  const { data: insightData, isLoading: insightsLoading, error: insightsError } = useFetchInsights(activeCampaignId)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [dismissedErrors, setDismissedErrors] = useState({})

  // Auto-open modal jika tidak terkoneksi (melalui prop dari parent)
  useEffect(() => {
    if (!connectionLoading && !isConnected) {
      onOpenConnectModal()
    }
  }, [connectionLoading, isConnected, onOpenConnectModal])

  const getMetricsDisplay = () => {
    if (!insightData) {
      return [
        { label: 'Total Spend', value: '-', unit: 'IDR', icon: <IconSpend /> },
        { label: 'Rata-rata CTR', value: '-', unit: '%', icon: <IconCTR /> },
        { label: 'ROAS', value: '-', unit: 'x', icon: <IconROAS /> },
        { label: 'Total Reach', value: '-', unit: 'orang', icon: <IconReach /> },
      ]
    }

    return [
      { label: 'Total Spend', value: insightData.spend ? Math.round(insightData.spend).toLocaleString('id-ID') : '-', unit: 'IDR', icon: <IconSpend /> },
      { label: 'Rata-rata CTR', value: insightData.ctr ? insightData.ctr.toFixed(2) : '-', unit: '%', icon: <IconCTR /> },
      { label: 'ROAS', value: insightData.roas ? insightData.roas.toFixed(2) : '-', unit: 'x', icon: <IconROAS /> },
      { label: 'Total Reach', value: insightData.reach ? Math.round(insightData.reach).toLocaleString('id-ID') : '-', unit: 'orang', icon: <IconReach /> },
    ]
  }

  const metrics = getMetricsDisplay()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 text-sm mt-1">Ringkasan performa iklan Meta Ads kamu</p>
      </div>

      {campaignsError && !dismissedErrors.campaigns && (
        <ErrorAlert message="Gagal memuat daftar kampanye" description={campaignsError} onClose={() => setDismissedErrors({ ...dismissedErrors, campaigns: true })} />
      )}

      {insightsError && !dismissedErrors.insights && (
        <WarningAlert message="Insights tidak tersedia" description={insightsError} onClose={() => setDismissedErrors({ ...dismissedErrors, insights: true })} />
      )}

      {campaignsLoading && <LoadingState message="Memuat daftar kampanye..." />}

      {!campaignsLoading && campaigns.length > 0 && (
        <FilterBar 
          selectedCampaignId={activeCampaignId} 
          onCampaignChange={setSelectedCampaignId} 
          campaigns={campaigns} 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange} 
          isLoading={campaignsLoading} 
        />
      )}

      {!campaignsLoading && campaigns.length === 0 && !campaignsError && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center space-y-2">
          <p className="text-sm font-semibold text-blue-400">Belum ada kampanye</p>
          <p className="text-xs text-gray-400">Buat kampanye di Meta Ads terlebih dahulu, lalu refresh halaman ini.</p>
          <button onClick={() => window.location.reload()} className="inline-block mt-3 px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm font-medium transition-colors">Refresh Halaman</button>
        </div>
      )}

      {insightsLoading ? <SkeletonCard count={4} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map((metric, idx) => <MetricCard key={idx} label={metric.label} value={metric.value} unit={metric.unit} icon={metric.icon} />)}
        </div>
      )}

      {insightsLoading ? (
        <div className="space-y-4">
          <SkeletonChart />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PerformanceChart metric="spend" timeRange="7H" isLoading={false} />
            <PerformanceChart metric="ctr" timeRange="7H" isLoading={false} />
          </div>
          <PerformanceChart metric="roas" timeRange="7H" isLoading={false} />
        </>
      )}
    </div>
  )
}

// PagePlaceholder
function PagePlaceholder({ title, desc }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-gray-400 text-sm mt-1">{desc}</p>
      </div>
      <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-12 flex items-center justify-center">
        <p className="text-gray-600 text-sm">Halaman ini sedang dikembangkan</p>
      </div>
    </div>
  )
}

// Main Dashboard (DIUBAH)
export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <PageDashboard onOpenConnectModal={() => setShowConnectModal(true)} />
      case 'campaigns':
        return <PagePlaceholder title="Kampanye" desc="Daftar kampanye Meta Ads kamu" />
      case 'ai':
        return <PagePlaceholder title="Rekomendasi AI" desc="Skor kesehatan iklan dan saran optimasi" />
      case 'report':
        return <PagePlaceholder title="Laporan" desc="Export laporan PDF satu klik" />
      default:
        return <PageDashboard onOpenConnectModal={() => setShowConnectModal(true)} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white"><IconMenu /></button>
          <h1 className="text-base font-bold text-white">Ad<span className="text-violet-400">Sight</span></h1>
          <div className="w-5" />
        </header>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      <ConnectMetaModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} onConnectSuccess={() => { setShowConnectModal(false); window.location.reload() }} />
    </div>
  )
}