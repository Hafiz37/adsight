// frontend/src/hooks/useFetchInsights.js

import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Map technical errors to user-friendly messages
 */
function mapErrorToMessage(error) {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui'

  // Network errors
  if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
    return 'Gagal terhubung ke server. Periksa koneksi internet kamu.'
  }

  // Axios response errors
  if (error.response) {
    const status = error.response.status
    const data = error.response.data

    switch (status) {
      case 400:
        return data?.message || 'Request tidak valid. Coba refresh halaman.'
      case 401:
        return 'Sesi berakhir. Silakan login kembali.'
      case 403:
        return 'Kamu tidak memiliki akses ke data ini.'
      case 404:
        return 'Data tidak ditemukan atau kampanye telah dihapus.'
      case 500:
        return 'Server mengalami masalah. Coba lagi dalam beberapa saat.'
      case 503:
        return 'Server sedang dalam pemeliharaan. Coba lagi nanti.'
      default:
        return data?.message || `Terjadi kesalahan (${status}). Coba lagi.`
    }
  }

  // Network request failed
  if (error.request && !error.response) {
    return 'Tidak bisa terhubung ke server. Periksa koneksi internet.'
  }

  // Other errors
  return error.message || 'Terjadi kesalahan yang tidak diketahui'
}

/**
 * Hook untuk fetch insights 1 kampanye
 */
export function useFetchInsights(campaignId, dateRange = { start: '', end: '' }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!campaignId) {
      const resetState = () => {
        setData(null)
        setError(null)
        setIsPaused(false)
        setIsLoading(false)
      }

      const timeoutId = window.setTimeout(resetState, 0)
      return () => window.clearTimeout(timeoutId)
    }

    const fetchInsights = async () => {
      setIsLoading(true)
      setError(null)
      setIsPaused(false)

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Sesi berakhir. Silakan login kembali.')
        }

        const params = {}
        if (dateRange.start && dateRange.end) {
          params.startDate = dateRange.start
          params.endDate = dateRange.end
        }

        const response = await axios.get(
          `${API_URL}/api/meta/campaigns/${campaignId}/insights`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params,
            timeout: 10000,
          }
        )

        const responseData = response.data.data
        if (responseData?.paused) {
          setIsPaused(true)
          setData(null)
          const msg = !dateRange.start
            ? 'Kampanye sedang Paused. Gunakan filter tanggal untuk melihat data saat kampanye masih aktif.'
            : 'Tidak ada data Meta Ads untuk periode yang dipilih pada kampanye ini.'
          setError(msg)
        } else if (responseData?.insights) {
          setData({
            spend: responseData.insights.spend || 0,
            ctr: responseData.insights.ctr || 0,
            roas: responseData.insights.roas || 0,
            reach: responseData.insights.reach || 0,
          })
          setError(null)
        } else {
          const errMsg = responseData?.metaError
            ? `Meta API Error: ${responseData.metaError}`
            : 'Meta Ads tidak mengembalikan data untuk periode ini.'
          setError(errMsg)
          setData(null)
        }
      } catch (err) {
        console.error('[useFetchInsights Error]', err)
        const userMessage = mapErrorToMessage(err)
        setError(userMessage)
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInsights()
  }, [campaignId, dateRange.start, dateRange.end, retryCount])

  const retry = () => {
    setRetryCount((prev) => prev + 1)
  }

  return { data, isLoading, error, isPaused, retry }
}

/**
 * Hook untuk fetch daftar kampanye
 */
export function useFetchCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Sesi berakhir. Silakan login kembali.')
        }

        const response = await axios.get(`${API_URL}/api/meta/campaigns`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        })

        const campaignList = response.data.campaigns || []
        
        if (campaignList.length === 0) {
          setError('Belum ada kampanye. Buat kampanye di Meta Ads terlebih dahulu.')
          setCampaigns([])
        } else {
          setCampaigns(campaignList)
          setError(null)
        }
      } catch (err) {
        console.error('[useFetchCampaigns Error]', err)
        const userMessage = mapErrorToMessage(err)
        setError(userMessage)
        setCampaigns([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCampaigns()
  }, [retryCount])

  const retry = () => {
    setRetryCount((prev) => prev + 1)
  }

  return { campaigns, isLoading, error, retry }
}

/**
 * Hook untuk check Meta connection
 */
export function useCheckMetaConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setIsConnected(false)
          setIsLoading(false)
          return
        }

        const response = await axios.get(`${API_URL}/api/meta/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        })

        const hasConnection = response.data && !!response.data.account
        setIsConnected(hasConnection)
        setError(null)
      } catch (err) {
        console.error('[useCheckMetaConnection Error]', err)
        setIsConnected(false)
        // Jangan set error di sini, biarkan silent
      } finally {
        setIsLoading(false)
      }
    }

    checkConnection()
  }, [])

  return { isConnected, isLoading, error }
}

/**
 * Hook untuk get historical insights data (untuk grafik)
 */
export function useFetchHistoricalInsights(campaignId, dateRange = null) {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!campaignId) {
      const resetState = () => {
        setData([])
        setError(null)
        setIsLoading(false)
      }

      const timeoutId = window.setTimeout(resetState, 0)
      return () => window.clearTimeout(timeoutId)
    }

    const fetchHistoricalData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Sesi berakhir. Silakan login kembali.')
        }

        let url = `${API_URL}/api/meta/campaigns/${campaignId}/insights-history`
        
        // Jika ada date range, tambahkan ke query
        if (dateRange?.start && dateRange?.end) {
          url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`
        }

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        })

        const historyData = response.data.history || []
        setData(historyData)
        if (response.data.paused) {
          setError('Kampanye sedang Paused — tidak ada data untuk periode ini. Gunakan filter tanggal untuk melihat data historis.')
        } else if (historyData.length === 0) {
          if (response.data.metaError) {
            setError(`Meta API Error: ${response.data.metaError}`)
          } else if (response.data.message && response.data.message !== 'Data history dari Meta Ads') {
            setError(response.data.message)
          } else {
            setError('Meta Ads tidak memiliki data untuk periode ini.')
          }
        } else {
          setError(null)
        }
      } catch (err) {
        console.error('[useFetchHistoricalInsights Error]', err)
        const userMessage = mapErrorToMessage(err)
        setError(userMessage)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistoricalData()
  }, [campaignId, dateRange?.start, dateRange?.end, retryCount])

  const retry = () => {
    setRetryCount((prev) => prev + 1)
  }

  return { data, isLoading, error, retry }
}