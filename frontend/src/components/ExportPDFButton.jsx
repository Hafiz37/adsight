// frontend/src/components/ExportPDFButton.jsx
// Tombol Export PDF dengan rendering offscreen template

import React, { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import ReportTemplate from './ReportTemplate'
import { exportToPDF } from '../utils/exportToPDF'

// Icon Download
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

// Icon Spinner
const IconSpinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
)

// Icon Check
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

/**
 * ExportPDFButton
 * 
 * Props:
 * - metrics: { spend, ctr, roas, reach }
 * - score: number (0-100)
 * - recommendations: array
 * - campaignName: string
 * - variant: 'primary' | 'secondary' | 'ghost' (style variant)
 * - size: 'sm' | 'md' | 'lg'
 * - className: string (tambahan class)
 */
export default function ExportPDFButton({ 
  metrics, 
  score = 0, 
  recommendations = [], 
  campaignName = 'Kampanye',
  variant = 'primary',
  size = 'md',
  className = '',
}) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState(null) // null | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const reportRef = useRef(null)
  const [showTemplate, setShowTemplate] = useState(false)

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true)
      setExportStatus(null)
      setErrorMessage('')

      // 1. Render template offscreen
      setShowTemplate(true)

      // 2. Tunggu template ter-render di DOM
      await new Promise(resolve => setTimeout(resolve, 500))

      // 3. Ambil referensi element
      const element = reportRef.current
      if (!element) {
        throw new Error('Template tidak bisa di-render. Coba refresh halaman.')
      }

      // 4. Export ke PDF
      const filename = `adshight-report`
      await exportToPDF(element, filename)

      setExportStatus('success')
      
      // Reset status setelah 3 detik
      setTimeout(() => {
        setExportStatus(null)
      }, 3000)

    } catch (error) {
      console.error('[ExportPDF Error]', error)
      setExportStatus('error')
      setErrorMessage(error.message || 'Gagal membuat PDF')
      
      setTimeout(() => {
        setExportStatus(null)
        setErrorMessage('')
      }, 5000)
    } finally {
      setIsExporting(false)
      // Hapus template dari DOM setelah selesai
      setTimeout(() => setShowTemplate(false), 500)
    }
  }, [metrics, score, recommendations, campaignName])

  // --- STYLES ---
  const getVariantClass = () => {
    if (exportStatus === 'success') {
      return 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20'
    }
    if (exportStatus === 'error') {
      return 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
    }

    switch (variant) {
      case 'secondary':
        return 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-600'
      case 'ghost':
        return 'bg-transparent hover:bg-gray-800/50 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
      case 'primary':
      default:
        return 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20'
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs gap-1.5'
      case 'lg':
        return 'px-6 py-3 text-base gap-2.5'
      case 'md':
      default:
        return 'px-4 py-2 text-sm gap-2'
    }
  }

  const getButtonContent = () => {
    if (isExporting) {
      return (
        <>
          <IconSpinner />
          <span>Membuat PDF...</span>
        </>
      )
    }
    if (exportStatus === 'success') {
      return (
        <>
          <IconCheck />
          <span>PDF Terunduh!</span>
        </>
      )
    }
    if (exportStatus === 'error') {
      return (
        <>
          <span>⚠️</span>
          <span>Gagal Export</span>
        </>
      )
    }
    return (
      <>
        <IconDownload />
        <span>Export PDF</span>
      </>
    )
  }

  return (
    <>
      {/* Tombol Export */}
      <div className="relative inline-block">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`
            inline-flex items-center justify-center font-semibold rounded-xl 
            transition-all duration-200 disabled:opacity-70 disabled:cursor-wait
            ${getVariantClass()} ${getSizeClass()} ${className}
          `}
          title={isExporting ? 'Sedang membuat PDF...' : 'Export laporan ke PDF'}
        >
          {getButtonContent()}
        </button>

        {/* Error tooltip */}
        {exportStatus === 'error' && errorMessage && (
          <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-red-900/90 border border-red-700 rounded-lg text-xs text-red-200 shadow-xl z-50 backdrop-blur-sm">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Render template offscreen via Portal */}
      {showTemplate && createPortal(
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            zIndex: -1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <div ref={reportRef}>
            <ReportTemplate
              metrics={metrics}
              score={score}
              recommendations={recommendations}
              campaignName={campaignName}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
