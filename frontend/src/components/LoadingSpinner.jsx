// frontend/src/components/LoadingSpinner.jsx

/**
 * Loading Spinner Component
 * Berbagai varian spinner untuk loading state
 */

// ─── Spinner Variant 1: Spinning Circle ──────────────────────────────────────
export function SpinnerCircle({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <svg
        className="animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" opacity="0.3" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
    </div>
  )
}

// ─── Spinner Variant 2: Dots ──────────────────────────────────────────────────
export function SpinnerDots({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-1 h-1 gap-1',
    md: 'w-2 h-2 gap-2',
    lg: 'w-3 h-3 gap-3',
  }

  return (
    <div className={`flex items-center ${sizeClasses[size]} ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-violet-400 rounded-full animate-bounce"
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Spinner Variant 3: Bars ──────────────────────────────────────────────────
export function SpinnerBars({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 gap-1',
    md: 'h-6 gap-1.5',
    lg: 'h-8 gap-2',
  }

  return (
    <div className={`flex items-end ${sizeClasses[size]} ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-violet-400 rounded-full w-1 animate-pulse"
          style={{
            animationDelay: `${i * 0.1}s`,
            height: `${20 + i * 15}%`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Full Page Loading Overlay ─────────────────────────────────────────────────
export function LoadingOverlay({ 
  isLoading, 
  message = 'Memuat data...',
  variant = 'circle' // 'circle', 'dots', 'bars'
}) {
  if (!isLoading) return null

  const spinnerMap = {
    circle: <SpinnerCircle size="lg" className="text-violet-400" />,
    dots: <SpinnerDots size="md" className="text-violet-400" />,
    bars: <SpinnerBars size="md" className="text-violet-400" />,
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-12 text-center space-y-4 max-w-sm">
        {spinnerMap[variant]}
        <p className="text-gray-300 font-medium">{message}</p>
      </div>
    </div>
  )
}

// ─── Inline Loading State (untuk card/container) ────────────────────────────
export function LoadingState({ 
  message = 'Memuat...',
  height = 'h-40',
  variant = 'circle'
}) {
  const spinnerMap = {
    circle: <SpinnerCircle size="md" className="text-violet-400" />,
    dots: <SpinnerDots size="sm" className="text-violet-400" />,
    bars: <SpinnerBars size="sm" className="text-violet-400" />,
  }

  return (
    <div className={`${height} rounded-lg bg-gray-800/50 border border-dashed border-gray-700 flex flex-col items-center justify-center gap-3`}>
      {spinnerMap[variant]}
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

// ─── Skeleton Loader (untuk card preview) ──────────────────────────────────
export function SkeletonCard({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 animate-pulse"
        >
          <div className="h-3 bg-gray-700 rounded w-20" />
          <div className="h-8 bg-gray-700 rounded w-32" />
          <div className="flex justify-between">
            <div className="h-3 bg-gray-700 rounded w-16" />
            <div className="h-3 bg-gray-700 rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Skeleton Chart ────────────────────────────────────────────────────────
export function SkeletonChart() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-1">
          <div className="h-4 bg-gray-700 rounded w-32" />
          <div className="h-3 bg-gray-700 rounded w-24" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-700 rounded w-12" />
          ))}
        </div>
      </div>
      <div className="h-64 bg-gray-800 rounded-lg" />
    </div>
  )
}

export default SpinnerCircle