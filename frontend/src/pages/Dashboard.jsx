// frontend/src/pages/Dashboard.jsx

import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()

  // Ambil data user dari localStorage
  const user = JSON.parse(localStorage.getItem('user'))

  const handleLogout = () => {
    // Hapus token dan data user dari localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // Redirect ke halaman login
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Ad<span className="text-violet-400">Sight</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            Keluar
          </button>
        </div>
      </nav>

      {/* Konten */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-white mb-2">
          Selamat datang! 👋
        </h2>
        <p className="text-gray-400 mb-8">
          Login berhasil. Dashboard sedang dalam pengembangan.
        </p>

        {/* Kartu info sementara */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-1">Status Akun</p>
            <p className="text-lg font-semibold text-violet-400">Aktif</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-1">Role</p>
            <p className="text-lg font-semibold text-violet-400">
              {user?.role || '-'}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-1">Meta Ads</p>
            <p className="text-lg font-semibold text-yellow-400">
              Belum terhubung
            </p>
          </div>
        </div>
      </main>

    </div>
  )
}