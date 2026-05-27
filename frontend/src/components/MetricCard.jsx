// frontend/src/components/MetricCard.jsx

export default function MetricCard({ label, value, unit, icon, trend, trendValue }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all duration-200">
      
      {/* Header: Label + Icon (optional) */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
          {label}
        </p>
        {icon && (
          <span className="text-violet-400">
            {icon}
          </span>
        )}
      </div>

      {/* Main Value */}
      <div className="mb-2">
        <p className="text-3xl font-bold text-white">
          {value === '-' ? '-' : value}
        </p>
      </div>

      {/* Unit + Trend (optional) */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">
          {unit}
        </p>
        
        {/* Trend indicator — naik/turun (optional) */}
        {trend && trendValue && (
          <span className={`text-xs font-medium ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}%
          </span>
        )}
      </div>

    </div>
  )
}