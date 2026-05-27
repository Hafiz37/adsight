// frontend/src/components/PerformanceChart.jsx

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

/**
 * Data sampel untuk grafik tren mingguan
 * Nantinya akan diganti dengan data dari API backend
 */
const SAMPLE_DATA = [
  { day: 'Senin', spend: 150000, ctr: 1.2, roas: 2.1 },
  { day: 'Selasa', spend: 175000, ctr: 1.5, roas: 2.3 },
  { day: 'Rabu', spend: 200000, ctr: 1.8, roas: 2.5 },
  { day: 'Kamis', spend: 180000, ctr: 1.6, roas: 2.4 },
  { day: 'Jumat', spend: 220000, ctr: 2.0, roas: 2.7 },
  { day: 'Sabtu', spend: 250000, ctr: 2.2, roas: 2.8 },
  { day: 'Minggu', spend: 240000, ctr: 2.1, roas: 2.6 },
]

// Custom tooltip untuk format yg lebih bagus
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-xs text-gray-400 font-medium">{payload[0].payload.day}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color }} className="text-xs font-semibold">
            {entry.name}: {entry.value.toLocaleString('id-ID')}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function PerformanceChart({ 
  data = SAMPLE_DATA, 
  metric = 'spend', // 'spend', 'ctr', 'roas'
  timeRange = '7H',  // '7H', '30H', '90H'
  isLoading = false,
  error = null,
}) {
  
  // Tentukan metrik mana yang ditampilkan
  const getChartConfig = () => {
    switch (metric) {
      case 'ctr':
        return {
          title: 'Click-Through Rate (CTR)',
          lines: [
            {
              dataKey: 'ctr',
              name: 'CTR (%)',
              stroke: '#a78bfa',
              strokeWidth: 2.5,
              dot: { fill: '#a78bfa', r: 4 },
              activeDot: { r: 6 },
            },
          ],
          yAxisLabel: 'CTR (%)',
        }
      case 'roas':
        return {
          title: 'Return on Ad Spend (ROAS)',
          lines: [
            {
              dataKey: 'roas',
              name: 'ROAS (x)',
              stroke: '#60a5fa',
              strokeWidth: 2.5,
              dot: { fill: '#60a5fa', r: 4 },
              activeDot: { r: 6 },
            },
          ],
          yAxisLabel: 'ROAS (x)',
        }
      case 'spend':
      default:
        return {
          title: 'Pengeluaran Iklan (Spend)',
          lines: [
            {
              dataKey: 'spend',
              name: 'Spend (IDR)',
              stroke: '#f472b6',
              strokeWidth: 2.5,
              dot: { fill: '#f472b6', r: 4 },
              activeDot: { r: 6 },
            },
          ],
          yAxisLabel: 'Spend (IDR)',
        }
    }
  }

  const config = getChartConfig()

  if (error) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">{config.title}</h3>
        <div className="h-48 rounded-lg bg-red-500/10 border border-dashed border-red-500/30 flex items-center justify-center">
          <p className="text-sm text-red-400">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white">{config.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {timeRange === '7H' && 'Data mingguan'}
            {timeRange === '30H' && 'Data 30 hari'}
            {timeRange === '90H' && 'Data 90 hari'}
          </p>
        </div>

        {/* Range selector buttons */}
        <div className="flex gap-2">
          {['7H', '30H', '90H'].map((range) => (
            <button
              key={range}
              disabled // nanti enable ketika buat filter
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                timeRange === range
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="h-64 rounded-lg bg-gray-800/50 border border-dashed border-gray-700 flex items-center justify-center animate-pulse">
          <p className="text-sm text-gray-600">Memuat data grafik...</p>
        </div>
      )}

      {/* Chart */}
      {!isLoading && data && data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            {/* Background grid */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />

            {/* Axes */}
            <XAxis
              dataKey="day"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9ca3af' }}
              label={{
                value: config.yAxisLabel,
                angle: -90,
                position: 'insideLeft',
                fill: '#9ca3af',
                fontSize: 12,
                offset: 10,
              }}
            />

            {/* Custom tooltip */}
            <Tooltip content={<CustomTooltip />} />

            {/* Legend */}
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
              iconType="line"
            />

            {/* Lines */}
            {config.lines.map((line, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth}
                dot={line.dot}
                activeDot={line.activeDot}
                isAnimationActive={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Empty state */}
      {!isLoading && (!data || data.length === 0) && (
        <div className="h-64 rounded-lg bg-gray-800/50 border border-dashed border-gray-700 flex items-center justify-center">
          <p className="text-sm text-gray-600">Tidak ada data untuk ditampilkan</p>
        </div>
      )}

    </div>
  )
}