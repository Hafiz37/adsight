// frontend/src/components/ReportTemplate.jsx
// Template laporan PDF — di-render offscreen, lalu di-capture oleh html2canvas

import React from 'react'

// --- HELPER FUNCTIONS ---
const getScoreColor = (score) => {
  if (score < 40) return '#ef4444'  // red-500
  if (score < 70) return '#eab308'  // yellow-500
  return '#22c55e'                   // green-500
}

const getScoreLabel = (score) => {
  if (score < 40) return 'Buruk'
  if (score < 70) return 'Cukup'
  return 'Bagus'
}

const getPriorityStyle = (priority) => {
  if (priority === 'high') return { bg: '#7f1d1d', color: '#fca5a5', border: '#b91c1c', label: 'Prioritas Tinggi', icon: '⚠️' }
  if (priority === 'medium') return { bg: '#713f12', color: '#fde047', border: '#a16207', label: 'Prioritas Sedang', icon: '⚡' }
  return { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8', label: 'Prioritas Rendah', icon: '✨' }
}

const formatNumber = (num) => {
  if (!num && num !== 0) return '-'
  return Math.round(num).toLocaleString('id-ID')
}

const formatDate = () => {
  const now = new Date()
  return now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatTime = () => {
  const now = new Date()
  return now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * ReportTemplate — Komponen yang di-render di offscreen lalu di-capture ke PDF
 * 
 * Props:
 * - metrics: { spend, ctr, roas, reach }
 * - score: number (0-100)
 * - recommendations: array of { id, title, description, priority }
 * - campaignName: string
 */
export default function ReportTemplate({ metrics, score = 0, recommendations = [], campaignName = 'Kampanye' }) {
  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)

  return (
    <div
      data-report-template
      style={{
        width: '794px', // A4 width at 96 DPI
        minHeight: '1123px',
        backgroundColor: '#030712',
        color: '#f9fafb',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        padding: '40px',
        boxSizing: 'border-box',
      }}
    >
      {/* ============ HEADER ============ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '2px solid #1f2937',
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            margin: '0 0 4px 0',
            letterSpacing: '-0.5px',
          }}>
            Ad<span style={{ color: '#a78bfa' }}>Sight</span>
          </h1>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: 0,
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            Laporan Performa Iklan
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 4px 0' }}>
            {formatDate()}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
            Dibuat pukul {formatTime()} WIB
          </p>
        </div>
      </div>

      {/* ============ CAMPAIGN INFO ============ */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '28px',
        border: '1px solid #1f2937',
      }}>
        <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Nama Kampanye
        </p>
        <p style={{ fontSize: '18px', fontWeight: '700', color: '#a78bfa', margin: 0 }}>
          {campaignName}
        </p>
      </div>

      {/* ============ METRICS GRID ============ */}
      <h2 style={{
        fontSize: '16px',
        fontWeight: '700',
        marginBottom: '16px',
        color: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ color: '#a78bfa' }}>📊</span> Ringkasan Metrik
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '12px',
        marginBottom: '32px',
      }}>
        {/* Total Spend */}
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #1f2937',
        }}>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Spend
          </p>
          <p style={{ fontSize: '22px', fontWeight: '800', color: '#f9fafb', margin: '0 0 4px 0' }}>
            {metrics?.spend ? formatNumber(metrics.spend) : '-'}
          </p>
          <p style={{ fontSize: '11px', color: '#4b5563', margin: 0 }}>IDR</p>
        </div>

        {/* CTR */}
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #1f2937',
        }}>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Rata-rata CTR
          </p>
          <p style={{ fontSize: '22px', fontWeight: '800', color: '#f9fafb', margin: '0 0 4px 0' }}>
            {metrics?.ctr ? metrics.ctr.toFixed(2) : '-'}
          </p>
          <p style={{ fontSize: '11px', color: '#4b5563', margin: 0 }}>%</p>
        </div>

        {/* ROAS */}
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #1f2937',
        }}>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ROAS
          </p>
          <p style={{ fontSize: '22px', fontWeight: '800', color: '#f9fafb', margin: '0 0 4px 0' }}>
            {metrics?.roas ? metrics.roas.toFixed(2) : '-'}
          </p>
          <p style={{ fontSize: '11px', color: '#4b5563', margin: 0 }}>x</p>
        </div>

        {/* Reach */}
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #1f2937',
        }}>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Reach
          </p>
          <p style={{ fontSize: '22px', fontWeight: '800', color: '#f9fafb', margin: '0 0 4px 0' }}>
            {metrics?.reach ? formatNumber(metrics.reach) : '-'}
          </p>
          <p style={{ fontSize: '11px', color: '#4b5563', margin: 0 }}>orang</p>
        </div>
      </div>

      {/* ============ SKOR KESEHATAN IKLAN ============ */}
      <h2 style={{
        fontSize: '16px',
        fontWeight: '700',
        marginBottom: '16px',
        color: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ color: '#a78bfa' }}>🎯</span> Skor Kesehatan Iklan
      </h2>

      <div style={{
        backgroundColor: '#111827',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        border: '1px solid #1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
      }}>
        {/* Skor Lingkaran */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: `6px solid ${scoreColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          backgroundColor: '#030712',
          position: 'relative',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '36px',
              fontWeight: '800',
              color: scoreColor,
              lineHeight: 1,
            }}>
              {Math.round(score)}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              marginTop: '2px',
            }}>
              / 100
            </div>
          </div>
        </div>

        {/* Detail Skor */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '8px',
          }}>
            Status: <span style={{ color: scoreColor }}>{scoreLabel}</span>
          </div>
          <p style={{
            fontSize: '13px',
            color: '#9ca3af',
            margin: '0 0 12px 0',
            lineHeight: 1.6,
          }}>
            {score < 40 && 'Performa iklan memerlukan perbaikan segera. Tinjau rekomendasi di bawah ini untuk meningkatkan efektivitas kampanye Anda.'}
            {score >= 40 && score < 70 && 'Performa iklan sudah cukup baik, tetapi masih ada ruang untuk peningkatan. Ikuti rekomendasi di bawah.'}
            {score >= 70 && 'Performa iklan sangat baik! Pertahankan strategi saat ini dan pertimbangkan untuk meningkatkan budget.'}
          </p>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#1f2937',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${score}%`,
              height: '100%',
              backgroundColor: scoreColor,
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* ============ REKOMENDASI AI ============ */}
      {recommendations.length > 0 && (
        <>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ color: '#a78bfa' }}>⚡</span> Rekomendasi Optimasi ({recommendations.length})
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '32px',
          }}>
            {recommendations.map((rec, idx) => {
              const priorityStyle = getPriorityStyle(rec.priority)
              return (
                <div
                  key={rec.id || idx}
                  style={{
                    backgroundColor: '#111827',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #1f2937',
                    borderLeft: `4px solid ${priorityStyle.border}`,
                  }}
                >
                  {/* Header rekomendasi */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}>
                      <span style={{ fontSize: '20px' }}>{priorityStyle.icon}</span>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        color: '#f9fafb',
                      }}>
                        {rec.title}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: priorityStyle.bg,
                      color: priorityStyle.color,
                      border: `1px solid ${priorityStyle.border}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {priorityStyle.label}
                    </span>
                  </div>

                  {/* Deskripsi */}
                  {rec.description && (
                    <p style={{
                      fontSize: '13px',
                      color: '#9ca3af',
                      margin: 0,
                      lineHeight: 1.6,
                      paddingLeft: '30px',
                    }}>
                      {rec.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ============ FOOTER ============ */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #1f2937',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: '11px', color: '#4b5563', margin: '0 0 4px 0' }}>
            Laporan ini dihasilkan secara otomatis oleh AdSight AI Engine
          </p>
          <p style={{ fontSize: '10px', color: '#374151', margin: 0 }}>
            © {new Date().getFullYear()} AdSight — Konsultan Digital Marketing Virtual 24/7
          </p>
        </div>
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '8px',
          padding: '8px 16px',
          border: '1px solid #1f2937',
        }}>
          <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>
            Powered by <span style={{ color: '#a78bfa', fontWeight: '700' }}>AdSight AI</span>
          </p>
        </div>
      </div>
    </div>
  )
}
