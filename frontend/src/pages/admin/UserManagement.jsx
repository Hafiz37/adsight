import React, { useState, useEffect } from 'react';
import { adminService } from '../../utils/adminService';

export default function UserManagement() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState(''); // 'active' or 'banned'
  
  // Modal details
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  
  // Action details
  const [banReason, setBanReason] = useState('');
  const [showBanInput, setShowBanInput] = useState(false);
  
  const fetchUsers = async (pageToFetch = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageToFetch,
        limit: 10,
        search,
        role: role || undefined,
        status: status || undefined
      };
      
      const response = await adminService.getUsers(params);
      if (response.success) {
        setUsers(response.data);
        setPagination(response.pagination);
      } else {
        setError('Gagal mengambil daftar user.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [role, status]); // refetch when filters change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleOpenDetail = async (user) => {
    setSelectedUser(null);
    setModalError('');
    setModalSuccess('');
    setShowBanInput(false);
    setBanReason('');
    
    // Open modal immediately and set loading
    setSelectedUser({ ...user, isLoadingDetail: true });
    
    try {
      const response = await adminService.getUserDetail(user.id);
      if (response.success) {
        setSelectedUser({ ...user, ...response.data, isLoadingDetail: false });
      } else {
        setModalError('Gagal memuat detail lengkap user.');
      }
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Gagal mengambil detail user dari server.');
    }
  };

  const handleResetPassword = async (email) => {
    if (!window.confirm(`Reset password untuk user ${email}? Password baru akan dikirimkan ke email user.`)) {
      return;
    }
    
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');
    
    try {
      const response = await adminService.resetPassword(email);
      if (response.message) {
        setModalSuccess(
          `Password berhasil di-reset!\n\n` +
          `• Temporary Password: ${response.tempPassword || 'Dibuat sistem'}\n` +
          `• Status email: Terkirim\n` +
          (response.emailPreview ? `• Preview link (Ethereal): ${response.emailPreview}` : '')
        );
      }
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Gagal mereset password.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleBanUser = async (user) => {
    if (user.isBanned) {
      // Unban flow
      if (!window.confirm(`Aktifkan kembali akun ${user.email}?`)) return;
      setModalLoading(true);
      setModalError('');
      setModalSuccess('');
      
      try {
        const response = await adminService.banUser(user.id, false);
        setModalSuccess('Akun berhasil diaktifkan kembali.');
        // Update local detail state
        setSelectedUser(prev => ({ ...prev, isBanned: false, banReason: null }));
        // Refresh table list
        fetchUsers(pagination.page);
      } catch (err) {
        console.error(err);
        setModalError(err.response?.data?.message || 'Gagal mengaktifkan kembali akun.');
      } finally {
        setModalLoading(false);
      }
    } else {
      // Show reason input
      setShowBanInput(true);
    }
  };

  const submitBan = async (e) => {
    e.preventDefault();
    if (!banReason.trim()) {
      alert('Alasan suspensi harus diisi!');
      return;
    }
    
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');
    
    try {
      const response = await adminService.banUser(selectedUser.id, true, banReason);
      setModalSuccess('User berhasil dinonaktifkan/ditangguhkan.');
      setSelectedUser(prev => ({ ...prev, isBanned: true, banReason }));
      setShowBanInput(false);
      setBanReason('');
      fetchUsers(pagination.page);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Gagal menangguhkan akun.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const doubleConfirm = window.confirm(
      `Peringatan Kritis!\n\n` +
      `Apakah Anda yakin ingin menghapus akun ${user.email} secara permanen?\n` +
      `Aksi ini juga akan menghapus semua kampanye Meta Ads dan akun Meta yang terhubung dengannya secara permanen. Aksi ini tidak dapat dibatalkan!`
    );
    if (!doubleConfirm) return;
    
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');
    
    try {
      await adminService.deleteUser(user.id);
      alert(`User ${user.email} berhasil dihapus.`);
      setSelectedUser(null); // Close modal
      fetchUsers(1); // Refresh table from page 1
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Gagal menghapus user.');
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <p className="text-gray-400 text-sm mt-1">Kelola data pengguna, perbarui password, suspen akun, atau hapus data secara permanen</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari user berdasarkan email..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); fetchUsers(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>
            
            <button
              type="submit"
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              Cari
            </button>
          </div>

          <div className="w-full md:w-auto flex gap-3">
            {/* Filter Role */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-violet-500 text-sm cursor-pointer"
            >
              <option value="">Semua Role</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            {/* Filter Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-violet-500 text-sm cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned/Suspended</option>
            </select>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Memuat data pengguna...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-400 font-semibold px-4">{error}</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-500 px-4">
            Tidak ada pengguna ditemukan dengan kriteria pencarian di atas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs font-semibold uppercase tracking-wider bg-gray-950/20">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Tanggal Dibuat</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-850/20 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-gray-450">{u.id}</td>
                    <td className="py-4 px-6 font-semibold text-gray-150">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        u.role === 'ADMIN' 
                          ? 'bg-violet-600/10 border-violet-500/30 text-violet-400' 
                          : 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        u.isBanned 
                          ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                          : 'bg-green-500/10 border-green-500/20 text-green-400'
                      }`}>
                        {u.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleOpenDetail(u)}
                        className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-violet-400 border border-gray-700 hover:border-gray-650 transition-all text-xs font-semibold cursor-pointer"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && users.length > 0 && (
          <div className="border-t border-gray-800 px-6 py-4 flex items-center justify-between text-sm text-gray-400">
            <div>
              Menampilkan {users.length} dari <span className="text-white font-semibold">{pagination.total}</span> user
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3.5 py-1.5 rounded-lg bg-gray-800 border border-gray-750 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-750 text-xs font-semibold transition-all cursor-pointer"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-xs font-semibold text-gray-300">
                Halaman {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3.5 py-1.5 rounded-lg bg-gray-800 border border-gray-750 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-750 text-xs font-semibold transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white text-2xl font-bold cursor-pointer"
            >
              &times;
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white">Detail Pengguna</h3>
              <p className="text-xs text-gray-400 mt-0.5">ID: {selectedUser.id}</p>
            </div>

            {/* Modal Alerts */}
            {modalError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs whitespace-pre-wrap">
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs whitespace-pre-wrap">
                {modalSuccess}
              </div>
            )}

            {selectedUser.isLoadingDetail ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Memuat detail user & campaign...</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* General Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950/40 p-4 rounded-xl border border-gray-800/60 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">EMAIL</p>
                    <p className="text-gray-200 mt-0.5 font-medium truncate">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">ROLE / STATUS</p>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-0.5 text-xs rounded bg-violet-600/20 text-violet-400 border border-violet-500/30 font-semibold">{selectedUser.role}</span>
                      <span className={`px-2 py-0.5 text-xs rounded font-semibold ${selectedUser.isBanned ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>{selectedUser.isBanned ? 'Banned' : 'Active'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">TERHUBUNG META ADS</p>
                    <p className="text-gray-200 mt-0.5 font-medium">
                      {selectedUser.metaAccounts?.length > 0 
                        ? `${selectedUser.metaAccounts[0].accountName} (${selectedUser.metaAccounts[0].accountId})` 
                        : 'Tidak Terhubung'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">JUMLAH KAMPANYE</p>
                    <p className="text-gray-200 mt-0.5 font-medium">{selectedUser.campaignsCount || 0} kampanye</p>
                  </div>
                  {selectedUser.isBanned && (
                    <div className="sm:col-span-2 bg-red-500/5 border border-red-500/25 p-3 rounded-lg mt-1">
                      <p className="text-xs text-red-400 font-bold">ALASAN BAN / SUSPENSI</p>
                      <p className="text-xs text-gray-300 mt-1 italic">{selectedUser.banReason || 'Tidak disebutkan'}</p>
                    </div>
                  )}
                </div>

                {/* Ban input form if toggled */}
                {showBanInput && (
                  <form onSubmit={submitBan} className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-orange-400">Masukan Alasan Suspensi/Ban</p>
                    <input
                      type="text"
                      required
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Contoh: Pelanggaran aturan platform atau spamming..."
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-orange-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowBanInput(false)}
                        className="px-3 py-1.5 rounded bg-gray-800 text-gray-400 text-xs font-medium cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={modalLoading}
                        className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        {modalLoading ? 'Memproses...' : 'Terapkan Ban'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Audit Logs History */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Histori Aktivitas User (10 Terakhir)</h4>
                  {selectedUser.auditLogs?.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">Belum ada aktivitas user tercatat.</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-gray-800 rounded-xl divide-y divide-gray-850 bg-gray-950/20">
                      {selectedUser.auditLogs?.map((log) => (
                        <div key={log.id} className="p-2.5 flex justify-between text-xs hover:bg-gray-850/10">
                          <div>
                            <span className="font-semibold text-gray-300">[{log.action}]</span>
                            <span className="text-gray-400 ml-1.5">{log.description}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 ml-2 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                <div className="border-t border-gray-800 pt-5 flex flex-wrap gap-2.5 justify-between">
                  {/* Left: Administrative actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResetPassword(selectedUser.email)}
                      disabled={modalLoading}
                      className="px-4 py-2 rounded-xl bg-yellow-600/20 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all cursor-pointer"
                    >
                      Reset Password
                    </button>
                    
                    {currentUser.email !== selectedUser.email && (
                      <button
                        onClick={() => handleBanUser(selectedUser)}
                        disabled={modalLoading}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${
                          selectedUser.isBanned 
                            ? 'bg-green-600/20 hover:bg-green-500/20 text-green-400 border-green-500/25' 
                            : 'bg-orange-600/20 hover:bg-orange-500/20 text-orange-400 border-orange-500/25'
                        }`}
                      >
                        {selectedUser.isBanned ? 'Aktifkan User (Unban)' : 'Tangguhkan User (Ban)'}
                      </button>
                    )}
                  </div>

                  {/* Right: Dangerous destructive actions */}
                  {currentUser.email !== selectedUser.email && (
                    <button
                      onClick={() => handleDeleteUser(selectedUser)}
                      disabled={modalLoading}
                      className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-500/20 text-red-400 border border-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all cursor-pointer"
                    >
                      Hapus User Permanen
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
