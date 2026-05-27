// frontend/src/components/ErrorAlert.jsx

import { useState, useEffect } from 'react'

// Ikon
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconError = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

/**
 * Error Alert Component - Dismissable alert untuk error messages
 */
export function ErrorAlert({
  message,
  description = null,
  onClose,
  details = null, // Technical details (hidden by default)
  showDetails = false,
  autoClose = false,
  autoCloseDelay = 5000,
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [showTechnical, setShowTechnical] = useState(showDetails)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  // Auto close timer
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(handleClose, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDelay])

  if (!isVisible) return null

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <IconError className="text-red-400 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-400">
              {message}
            </p>
            {description && (
              <p className="text-xs text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleClose}
          className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
        >
          <IconClose />
        </button>
      </div>

      {/* Technical Details (collapsible) */}
      {details && (
        <div className="space-y-1 border-t border-red-500/20 pt-2">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
          >
            {showTechnical ? '▼ Sembunyikan' : '▶ Tampilkan'} detail teknis
          </button>

          {showTechnical && (
            <div className="bg-red-900/20 border border-red-500/20 rounded p-2 font-mono text-xs text-red-300/80 overflow-auto max-h-32">
              {details}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

/**
 * Warning Alert Component
 */
export function WarningAlert({
  message,
  description = null,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
}) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  // Auto close timer
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(handleClose, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDelay])

  if (!isVisible) return null

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <IconWarning className="text-yellow-400 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-400">
              {message}
            </p>
            {description && (
              <p className="text-xs text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleClose}
          className="text-yellow-400 hover:text-yellow-300 transition-colors flex-shrink-0"
        >
          <IconClose />
        </button>
      </div>
    </div>
  )
}

/**
 * Info Alert Component
 */
export function InfoAlert({
  message,
  description = null,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  // Auto close timer
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(handleClose, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDelay])

  if (!isVisible) return null

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <IconInfo className="text-blue-400 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-400">
              {message}
            </p>
            {description && (
              <p className="text-xs text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleClose}
          className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
        >
          <IconClose />
        </button>
      </div>
    </div>
  )
}

/**
 * Error Container - untuk menampilkan error dalam card/container
 */
export function ErrorContainer({
  title = 'Terjadi Kesalahan',
  message = 'Gagal mengambil data. Silakan coba lagi.',
  onRetry,
  details = null,
}) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-6 space-y-4">
      
      {/* Header */}
      <div className="flex items-start gap-3">
        <IconError className="text-red-400 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-red-400">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{message}</p>
        </div>
      </div>

      {/* Details (collapsible) */}
      {details && (
        <div className="space-y-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
          >
            {showDetails ? '▼ Sembunyikan' : '▶ Tampilkan'} detail teknis
          </button>

          {showDetails && (
            <div className="bg-red-900/10 border border-red-500/20 rounded p-3 font-mono text-xs text-red-300/80 overflow-auto max-h-32">
              {details}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium text-sm transition-colors"
        >
          Coba Lagi
        </button>
      )}

    </div>
  )
}

export default ErrorAlert