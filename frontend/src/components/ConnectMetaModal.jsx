// frontend/src/components/ConnectMetaModal.jsx

import { useState, useEffect } from 'react'

// Ikon close
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// Ikon Meta
const IconMeta = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
  </svg>
)

// Ikon loading
const IconSpinner = () => (
  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" stroke="currentColor" opacity="0.3" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
)

export default function ConnectMetaModal({ isOpen, onClose, onConnectSuccess, adAccounts = [], accessToken = "" }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedAccountId, setSelectedAccountId] = useState('')

  // Set default selected account when the list of ad accounts is updated
  useEffect(() => {
    if (adAccounts && adAccounts.length > 0) {
      setSelectedAccountId(adAccounts[0].id)
    }
  }, [adAccounts])

  const handleConnectClick = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token tidak ditemukan. Silakan login kembali.')
      }

      // Panggil endpoint backend untuk dapatkan OAuth URL
      const response = await fetch('http://localhost:5000/api/meta/connect', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Gagal mendapatkan authorization URL')
      }

      const data = await response.json()
      const authUrl = data.authUrl

      if (!authUrl) {
        throw new Error('Authorization URL tidak ditemukan dalam response')
      }

      // Redirect ke Meta OAuth
      window.location.href = authUrl
    } catch (err) {
      console.error('Error connecting Meta:', err)
      setError(err.message || 'Gagal menghubungkan akun Meta Ads')
      setIsLoading(false)
    }
  }

  const handleSaveConnection = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token tidak ditemukan. Silakan login kembali.')
      }

      const selectedAccount = adAccounts.find(acc => acc.id === selectedAccountId)
      if (!selectedAccount) {
        throw new Error('Silakan pilih akun iklan terlebih dahulu.')
      }

      const response = await fetch('http://localhost:5000/api/meta/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          accessToken: accessToken,
          accountId: selectedAccount.id,
          accountName: selectedAccount.name,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Gagal menyimpan koneksi Meta Ads')
      }

      if (onConnectSuccess) {
        onConnectSuccess()
      }
    } catch (err) {
      console.error('Error saving Meta connection:', err)
      setError(err.message || 'Gagal menyimpan koneksi Meta Ads')
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const isSelectionMode = adAccounts && adAccounts.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-800/50">
          <h2 className="text-lg font-bold text-white">
            {isSelectionMode ? 'Pilih Akun Iklan Meta' : 'Hubungkan Meta Ads'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <IconClose />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          
          {isSelectionMode ? (
            // === AD ACCOUNT SELECTION MODE ===
            <>
              <div className="space-y-2">
                <p className="text-white font-semibold text-sm">
                  Daftar Akun Iklan (Ad Accounts) Ditemukan
                </p>
                <p className="text-xs text-gray-400">
                  Iklan pada Fanspage Facebook Anda dikelola melalui Akun Iklan. Silakan pilih akun iklan yang aktif melakukan penayangan iklan:
                </p>
              </div>

              {/* List of Accounts */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {adAccounts.map((account) => {
                  const isSelected = selectedAccountId === account.id;
                  return (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-md shadow-blue-500/5'
                          : 'bg-gray-800/40 border-gray-800 text-gray-300 hover:bg-gray-800/60 hover:border-gray-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{account.name}</p>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">ID: {account.id}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-600'
                      }`}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            // === STANDARD CONNECT MODE ===
            <>
              {/* Illustration / Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <IconMeta />
                </div>
              </div>

              {/* Text */}
              <div className="text-center space-y-2">
                <p className="text-white font-semibold">
                  Hubungkan Akun Meta Ads Kamu
                </p>
                <p className="text-sm text-gray-400">
                  Kami akan mengakses kampanye dan insights iklan kamu untuk analisis otomatis menggunakan AI.
                </p>
              </div>

              {/* Permissions info */}
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-2 text-xs text-gray-400">
                <p className="font-medium text-gray-300">Kami akan mengakses:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Daftar kampanye iklan</li>
                  <li>Insights (spend, CTR, ROAS, reach)</li>
                  <li>Status kampanye</li>
                </ul>
              </div>
            </>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

        </div>

        {/* Footer / Actions */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            Batal
          </button>
          
          {isSelectionMode ? (
            <button
              onClick={handleSaveConnection}
              disabled={isLoading || !selectedAccountId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium transition-colors cursor-pointer text-sm"
            >
              {isLoading && <IconSpinner />}
              {isLoading ? 'Menyimpan...' : 'Hubungkan Akun'}
            </button>
          ) : (
            <button
              onClick={handleConnectClick}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium transition-colors cursor-pointer text-sm"
            >
              {isLoading && <IconSpinner />}
              {isLoading ? 'Menghubungkan...' : 'Hubungkan Sekarang'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}