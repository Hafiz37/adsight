import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../utils/adminService';

// Custom icons matching dashboard theme
const IconSpend = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" /></svg>;
const IconCTR = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19H3V7a2 2 0 0 1 2-2h2" /><path d="M22 16a6 6 0 0 1-9.39-5.46" /></svg>;
const IconROAS = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>;
const IconCampaign = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
const IconAlert = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      } else {
        setError('Gagal mengambil statistik dashboard.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Memuat statistik dashboard admin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center space-y-4 max-w-lg mx-auto">
        <h3 className="text-lg font-bold text-red-400">Terjadi Kesalahan</h3>
        <p className="text-sm text-gray-400">{error}</p>
        <button 
          onClick={fetchStats}
          className="px-5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-all"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const cards = [
    { label: 'Total User Terdaftar', value: stats.totalUsers, unit: 'user', icon: <IconUsers />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Total Kampanye', value: stats.totalCampaigns, unit: 'kampanye', icon: <IconCampaign />, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    { label: 'Kampanye Aktif', value: stats.activeCampaigns, unit: 'aktif', icon: <IconCampaign />, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { label: 'Total Spend Platform', value: Math.round(stats.totalSpend).toLocaleString('id-ID'), unit: 'IDR', icon: <IconSpend />, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    { label: 'Rata-rata ROAS', value: stats.averageROAS?.toFixed(2) || '0.00', unit: 'x', icon: <IconROAS />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Rata-rata CTR', value: stats.averageCTR?.toFixed(2) || '0.00', unit: '%', icon: <IconCTR />, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <p className="text-gray-400 text-sm mt-1">Status global performa iklan, akun pengguna, dan aktivitas sistem</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, idx) => (
          <div key={idx} className={`p-6 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-between shadow-lg hover:border-gray-750 transition-all`}>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{card.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-white">{card.value}</span>
                <span className="text-xs text-gray-400 font-medium">{card.unit}</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${card.color}`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Low Performance Campaigns */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-red-400"><IconAlert /></span>
              Perlu Perhatian (AI Score &lt; 40)
            </h3>
            <Link to="/admin/campaigns" className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Lihat Semua
            </Link>
          </div>

          {stats.lowPerformingCampaigns?.length === 0 ? (
            <div className="bg-gray-850/50 border border-gray-800/40 rounded-xl p-8 text-center text-gray-400 text-sm">
              Semua kampanye berjalan dengan baik (tidak ada kampanye dengan skor AI rendah).
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {stats.lowPerformingCampaigns.map((c) => (
                <div key={c.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-200">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      Owner: <span className="text-gray-400 font-medium">{c.metaAccount?.user?.email || '-'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      <p className="text-gray-400 font-medium">ROAS: {c.roas?.toFixed(2)}x</p>
                      <p className="text-gray-500">Spend: Rp{Math.round(c.spend).toLocaleString('id-ID')}</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-extrabold rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                      Skor: {c.aiRecommendation?.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Recent Audit Logs */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Log Aktivitas Terbaru</h3>
          <Link to="/admin/audit-logs" className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            Lihat Log Lengkap
          </Link>
        </div>

        {stats.recentAuditLogs?.length === 0 ? (
          <div className="bg-gray-850/50 border border-gray-800/40 rounded-xl p-8 text-center text-gray-400 text-sm">
            Belum ada aktivitas admin tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Admin</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {stats.recentAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-850/30 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-medium truncate max-w-[150px]">
                      {log.user?.email || 'System'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.action.includes('DELETE') ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        log.action.includes('BAN') ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                        log.action.includes('RESET') ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                        'bg-violet-500/10 border-violet-500/20 text-violet-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-450">
                      {log.resourceType}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs max-w-xs truncate">
                      {log.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
