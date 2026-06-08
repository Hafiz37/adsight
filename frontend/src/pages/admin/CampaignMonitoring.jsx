import React, { useState, useEffect } from 'react';
import { adminService } from '../../utils/adminService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function CampaignMonitoring() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'analytics'
  
  // List States
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [maxSpend, setMaxSpend] = useState('');
  const [minRoas, setMinRoas] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Analytics States
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  const fetchCampaigns = async (pageToFetch = 1) => {
    setListLoading(true);
    setListError('');
    try {
      const params = {
        page: pageToFetch,
        limit: 10,
        search,
        status: status || undefined,
        minSpend: minSpend ? parseFloat(minSpend) : undefined,
        maxSpend: maxSpend ? parseFloat(maxSpend) : undefined,
        minRoas: minRoas ? parseFloat(minRoas) : undefined,
        sortBy,
        sortOrder
      };
      
      const response = await adminService.getCampaigns(params);
      if (response.success) {
        setCampaigns(response.data);
        setPagination(response.pagination);
      } else {
        setListError('Gagal memuat kampanye.');
      }
    } catch (err) {
      console.error(err);
      setListError(err.response?.data?.message || 'Gagal menghubungi server.');
    } finally {
      setListLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const response = await adminService.getCampaignAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setAnalyticsError('Gagal memuat analisis performa.');
      }
    } catch (err) {
      console.error(err);
      setAnalyticsError(err.response?.data?.message || 'Gagal mengambil analisis dari server.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchCampaigns(1);
    } else {
      fetchAnalytics();
    }
  }, [activeTab, status, sortBy, sortOrder]); // Refetch when config changes

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCampaigns(1);
  };

  // Recharts color palettes
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
  const PIE_COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

  // Prepare AI Score distribution data for chart
  const getScoreData = () => {
    if (!analytics?.scoreDistribution) return [];
    const dist = analytics.scoreDistribution;
    return [
      { name: 'Excellent (>=80)', value: dist.excellent },
      { name: 'Good (60-79)', value: dist.good },
      { name: 'Fair (40-59)', value: dist.fair },
      { name: 'Poor (<40)', value: dist.poor }
    ];
  };

  // Prepare status distribution data for chart
  const getStatusData = () => {
    if (!analytics?.statusBreakdown) return [];
    return Object.entries(analytics.statusBreakdown).map(([name, value]) => ({
      name,
      value
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Campaign Monitoring</h2>
          <p className="text-gray-400 text-sm mt-1">Pantau performa kampanye pemasaran, analisa return of spend, dan lihat sebaran efektivitas iklan</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list' 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Daftar Kampanye
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Analisis Performa
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Campaign Search */}
              <div className="sm:col-span-2 relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Kampanye</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan nama kampanye..."
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status Iklan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="">Semua Status</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                </select>
              </div>

              {/* Sorting Options */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Urutkan Berdasarkan</label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="createdAt">Tanggal Dibuat</option>
                    <option value="name">Nama Kampanye</option>
                    <option value="spend">Spend (Biaya)</option>
                    <option value="roas">ROAS</option>
                    <option value="ctr">CTR</option>
                    <option value="reach">Reach</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    <option value="desc">DESC</option>
                    <option value="asc">ASC</option>
                  </select>
                </div>
              </div>

              {/* Spend Boundaries */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Min Spend (IDR)</label>
                  <input
                    type="number"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    placeholder="Min"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Max Spend (IDR)</label>
                  <input
                    type="number"
                    value={maxSpend}
                    onChange={(e) => setMaxSpend(e.target.value)}
                    placeholder="Max"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* ROAS Boundaries */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Min ROAS (x)</label>
                <input
                  type="number"
                  step="0.1"
                  value={minRoas}
                  onChange={(e) => setMinRoas(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Filter Submit buttons */}
              <div className="sm:col-span-2 flex items-end gap-3 mt-1 sm:mt-0">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
                >
                  Terapkan Filter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearch(''); setStatus(''); setMinSpend(''); setMaxSpend(''); setMinRoas(''); setSortBy('createdAt'); setSortOrder('desc');
                    // Reset fetch
                    setTimeout(() => fetchCampaigns(1), 0);
                  }}
                  className="px-4 py-2.5 bg-gray-850 hover:bg-gray-800 text-gray-450 border border-gray-750 hover:text-white rounded-xl text-sm transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>

            </form>
          </div>

          {/* Campaigns Table List */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
            {listLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm font-medium">Memuat daftar kampanye...</p>
              </div>
            ) : listError ? (
              <div className="py-12 text-center text-red-400 font-semibold px-4">{listError}</div>
            ) : campaigns.length === 0 ? (
              <div className="py-16 text-center text-gray-500 px-4">
                Tidak ada kampanye ditemukan. Coba ubah parameter filter Anda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-xs font-semibold uppercase tracking-wider bg-gray-950/20">
                      <th className="py-4 px-6">Nama Kampanye</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Spend (Biaya)</th>
                      <th className="py-4 px-6 text-right">ROAS</th>
                      <th className="py-4 px-6 text-right">CTR</th>
                      <th className="py-4 px-6 text-right">Reach</th>
                      <th className="py-4 px-6">Pemilik Akun</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-gray-300">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-850/20 transition-colors">
                        <td className="py-4 px-6 font-semibold text-gray-150 max-w-xs truncate" title={c.name}>
                          {c.name}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            c.status === 'ACTIVE' 
                              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                              : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-xs text-gray-150">
                          Rp{Math.round(c.spend).toLocaleString('id-ID')}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-xs font-semibold text-gray-150">
                          {c.roas?.toFixed(2)}x
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-xs text-gray-200">
                          {c.ctr?.toFixed(2)}%
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-xs text-gray-200">
                          {Math.round(c.reach).toLocaleString('id-ID')}
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-400 truncate max-w-[180px]" title={c.metaAccount?.user?.email}>
                          {c.metaAccount?.user?.email || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!listLoading && campaigns.length > 0 && (
              <div className="border-t border-gray-800 px-6 py-4 flex items-center justify-between text-sm text-gray-400">
                <div>
                  Menampilkan {campaigns.length} dari <span className="text-white font-semibold">{pagination.total}</span> kampanye
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchCampaigns(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3.5 py-1.5 rounded-lg bg-gray-800 border border-gray-750 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-750 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs font-semibold text-gray-300">
                    Halaman {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchCampaigns(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3.5 py-1.5 rounded-lg bg-gray-800 border border-gray-750 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-750 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Analytics View */}
          {analyticsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm font-medium">Menghitung analitik agregat performa platform...</p>
            </div>
          ) : analyticsError ? (
            <div className="py-12 text-center text-red-400 font-semibold px-4">{analyticsError}</div>
          ) : !analytics ? (
            <div className="py-12 text-center text-gray-500 px-4">Data analisis tidak tersedia.</div>
          ) : (
            <div className="space-y-6">
              
              {/* Aggregates Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Kampanye</p>
                  <p className="text-xl font-bold mt-1 text-white">{analytics.totalCampaigns}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Spend</p>
                  <p className="text-xl font-bold mt-1 text-white">Rp{Math.round(analytics.totalSpend).toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Jangkauan</p>
                  <p className="text-xl font-bold mt-1 text-white">{Math.round(analytics.totalReach).toLocaleString('id-ID')} org</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold font-semibold">Rata-rata ROAS</p>
                  <p className="text-xl font-bold mt-1 text-emerald-400">{analytics.averageROAS?.toFixed(2)}x</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Rata-rata CTR</p>
                  <p className="text-xl font-bold mt-1 text-pink-400">{analytics.averageCTR?.toFixed(2)}%</p>
                </div>
              </div>

              {/* Graphic Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Score health distribution bar */}
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Distribusi Kesehatan Skor Kampanye (AI)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getScoreData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                        <XAxis dataKey="name" stroke="#A0AEC0" fontSize={11} />
                        <YAxis stroke="#A0AEC0" fontSize={11} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748', color: '#fff' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {getScoreData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status distribution pie */}
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sebaran Status Kampanye</h3>
                  <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div className="w-48 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getStatusData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getStatusData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748', color: '#fff' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Legend */}
                    <div className="space-y-2">
                      {getStatusData().map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="text-gray-400 font-semibold uppercase">{entry.name}:</span>
                          <span className="text-white font-bold">{entry.value} kampanye</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
}
