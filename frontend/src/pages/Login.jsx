// frontend/src/pages/Login.jsx

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Update nilai form saat user mengetik
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Kirim form ke backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: form.email,
        password: form.password,
      })

      // Simpan token & data user ke localStorage
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      // Redirect ke dashboard berdasarkan role
      if (response.data.user.role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else {
        navigate('/dashboard')
      }

    } catch (err) {
      // Tampilkan pesan error dari backend
      const msg = err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">

      {/* Card Login */}
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Ad<span className="text-violet-400">Sight</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Konsultan Digital Marketing Virtual 24/7
          </p>
        </div>

        <h2 className="text-xl font-semibold text-white mb-6">
          Masuk ke akun kamu
        </h2>

        {/* Pesan Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Input Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="kamu@email.com"
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-sm"
            />
          </div>

          {/* Input Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-sm"
            />
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors mt-2"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

        </form>

        {/* Link ke Register */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Belum punya akun?{' '}
          <Link
            to="/register"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Daftar sekarang
          </Link>
        </p>

      </div>
    </div>
  )
}


