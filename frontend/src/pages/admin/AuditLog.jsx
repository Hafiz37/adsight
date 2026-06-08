import React, { useState, useEffect } from 'react';
import { adminService } from '../../utils/adminService';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async (pageToFetch = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageToFetch,
        limit: 25,
        action: action || undefined,
        search: search || undefined
      };
      
      const response = await adminService.getAuditLogs(params);
      if (response.success) {
        setLogs(response.data);
        setPagination(response.pagination);
      } else {
        setError('Gagal memuat log audit.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [action]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const getActionBadgeColor = (act) => {
    if (act.includes('DELETE')) return 'bg-red-500/10 border-red-500/20 text-red-400';
    if (act.includes('BAN')) return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
    if (act.includes('RESET')) return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    if (act.includes('REGISTER')) return 'bg-green-500/10 border-green-500/20 text-green-400';
    if (act.includes('LOGIN')) return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    return 'bg-violet-500/10 border-violet-500/20 text-violet-400';
  };

  const actionsList = [
    { value: '', label: 'Semua Aksi' },
    { value: 'LOGIN', label: 'LOGIN' },
    { value: 'REGISTER', label: 'REGISTER' },
    { value: 'RESET_PASSWORD', label: 'RESET_PASSWORD' },
    { value: 'BAN_USER', label: 'BAN_USER' },
    { value: 'DELETE_USER', label: 'DELETE_USER' },
    { value: 'VIEW_DASHBOARD', label: 'VIEW_DASHBOARD' },
    { value: 'VIEW_CAMPAIGNS', label: 'VIEW_CAMPAIGNS' },
    { value: 'VIEW_CAMPAIGN_ANALYTICS', label: 'VIEW_CAMPAIGN_ANALYTICS' },
    { value: 'VIEW_AUDIT_LOGS', label: 'VIEW_AUDIT_LOGS' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white">Admin Audit Logs</h2>
        <p className="text-gray-400 text-sm mt-1">Lacak jejak audit dan riwayat aktivitas administrator demi keamanan dan transparansi sistem</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          {/* Description Search */}
          <div className="flex-1 w-full flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari deskripsi aktivitas (contoh: 'reset', 'ban')..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              Cari
            </button>
          </div>

          {/* Action Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              {actionsList.map((act) => (
                <option key={act.value} value={act.value}>
                  {act.label}
                </option>
              ))}
            </select>
          </div>

        </form>
      </div>

      {/* Logs Timeline View */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Memuat audit logs...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-400 font-semibold px-4">{error}</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-gray-500 px-4">
            Tidak ada aktivitas tercatat yang cocok dengan kriteria filter.
          </div>
        ) : (
          <div className="relative border-l border-gray-800 ml-4 pl-6 space-y-6">
            {logs.map((log) => (
              <div key={log.id} className="relative group">
                
                {/* Timeline Circle Bullet */}
                <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full bg-gray-900 border-2 border-violet-500 group-hover:bg-violet-500 transition-colors" />

                {/* Log block */}
                <div className="space-y-1">
                  
                  {/* Timestamp & Administrator */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-gray-500 font-medium">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </span>
                    <span className="text-gray-650">•</span>
                    <span className="text-gray-300 font-bold">
                      {log.user?.email || 'System'}
                    </span>
                    <span className="text-gray-650">•</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </div>

                  {/* Resource & Description details */}
                  <div className="bg-gray-950/20 border border-gray-800/40 p-3.5 rounded-xl hover:border-gray-800 transition-colors space-y-1.5">
                    <p className="text-sm font-medium text-gray-200">
                      {log.description}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <p>
                        Resource: <span className="font-mono text-gray-450 bg-gray-800/60 px-1.5 py-0.5 rounded text-[10px]">{log.resourceType}</span>
                      </p>
                      {log.resourceId && (
                        <p>
                          ID: <span className="font-mono text-gray-450 bg-gray-800/60 px-1.5 py-0.5 rounded text-[10px]">{log.resourceId}</span>
                        </p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {!loading && logs.length > 0 && (
          <div className="border-t border-gray-800 pt-6 flex items-center justify-between text-sm text-gray-400">
            <div>
              Menampilkan {logs.length} dari <span className="text-white font-semibold">{pagination.total}</span> log audit
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3.5 py-1.5 rounded-lg bg-gray-800 border border-gray-750 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-750 text-xs font-semibold transition-all cursor-pointer"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-xs font-semibold text-gray-300">
                Halaman {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3.5 py-1.5 rounded-lg bg-gray-800 border border-gray-750 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-750 text-xs font-semibold transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
