// frontend/src/components/FilterBar.jsx

import { useState } from 'react'

// Ikon calendar
const IconCalendar = ({ className = '' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

// Ikon dropdown
const IconChevronDown = ({ className = '' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export default function FilterBar({
  selectedCampaignId,
  onCampaignChange,
  campaigns = [],
  dateRange = { start: '', end: '' },
  onDateRangeChange,
  onResetFilter,
  isLoading = false,
}) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempDateRange, setTempDateRange] = useState(dateRange)

  // Handler untuk perubahan tanggal
  const handleStartDateChange = (e) => {
    const newStart = e.target.value
    setTempDateRange({ ...tempDateRange, start: newStart })
  }

  const handleEndDateChange = (e) => {
    const newEnd = e.target.value
    setTempDateRange({ ...tempDateRange, end: newEnd })
  }

  const getDefaultRange = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 6)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }

  // Apply filter tanggal
  const handleApplyDateRange = () => {
    if (tempDateRange.start && tempDateRange.end) {
      if (new Date(tempDateRange.start) > new Date(tempDateRange.end)) {
        alert('Tanggal mulai harus lebih awal dari tanggal akhir')
        return
      }
      onDateRangeChange(tempDateRange)
      setShowDatePicker(false)
    }
  }

  // Reset ke 7 hari terakhir
  const handleResetDateRange = () => {
    const defaultRange = getDefaultRange()
    setTempDateRange(defaultRange)
    onDateRangeChange(defaultRange)
    if (onResetFilter) onResetFilter()
    setShowDatePicker(false)
  }

  const hasActiveFilter = dateRange.start && dateRange.end

  return (
    <div className="space-y-4">
      {/* Desktop view — filter dalam 1 baris */}
      <div className="hidden md:flex gap-3 items-end">
        
        {/* Dropdown Kampanye */}
        <div className="flex-1">
          <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
            Pilih Kampanye
          </label>
          <div className="relative">
            <select
              value={selectedCampaignId}
              onChange={(e) => onCampaignChange(e.target.value)}
              disabled={isLoading || campaigns.length === 0}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm appearance-none focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">— Pilih kampanye —</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.metaCampaignId}>
                  {campaign.name}
                </option>
              ))}
            </select>
            <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="flex-1">
          <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
            Range Tanggal
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm text-left hover:border-gray-600 transition-colors flex items-center gap-2"
            >
              <IconCalendar className="text-gray-400" />
              {hasActiveFilter ? (
                <span>
                  {new Date(dateRange.start).toLocaleDateString('id-ID')} - {new Date(dateRange.end).toLocaleDateString('id-ID')}
                </span>
              ) : (
                <span className="text-gray-500">Pilih range tanggal...</span>
              )}
            </button>
            {hasActiveFilter && (
              <button
                onClick={handleResetDateRange}
                className="px-3 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Hari Ini
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Mobile view — filter dalam 2 baris */}
      <div className="md:hidden space-y-3">
        
        {/* Dropdown Kampanye Mobile */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
            Pilih Kampanye
          </label>
          <div className="relative">
            <select
              value={selectedCampaignId}
              onChange={(e) => onCampaignChange(e.target.value)}
              disabled={isLoading || campaigns.length === 0}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm appearance-none focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">— Pilih kampanye —</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.metaCampaignId}>
                  {campaign.name}
                </option>
              ))}
            </select>
            <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Date Range Picker Mobile */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
            Range Tanggal
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm text-left hover:border-gray-600 transition-colors flex items-center gap-2"
            >
              <IconCalendar className="text-gray-400" />
              {hasActiveFilter ? (
                <span className="text-xs">
                  {new Date(dateRange.start).toLocaleDateString('id-ID')} - {new Date(dateRange.end).toLocaleDateString('id-ID')}
                </span>
              ) : (
                <span className="text-gray-500 text-xs">Pilih range tanggal...</span>
              )}
            </button>
            {hasActiveFilter && (
              <button
                onClick={handleResetDateRange}
                className="px-3 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                Hari Ini
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Date Range Picker Modal/Dropdown */}
      {showDatePicker && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={tempDateRange.start}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={tempDateRange.end}
                onChange={handleEndDateChange}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleApplyDateRange}
              disabled={!tempDateRange.start || !tempDateRange.end}
              className="flex-1 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              Terapkan
            </button>
            <button
              onClick={handleResetDateRange}
              className="flex-1 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors cursor-pointer"
            >
              7 Hari
            </button>
            <button
              onClick={() => setShowDatePicker(false)}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  )
}