import React from 'react';

const ScoreGauge = ({ score = 0 }) => {
  // Tentukan warna berdasarkan skor
  const getColor = (score) => {
    if (score < 40) return 'from-red-500 to-red-600';
    if (score < 70) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  // Tentukan label berdasarkan skor
  const getLabel = (score) => {
    if (score < 40) return 'Buruk';
    if (score < 70) return 'Cukup';
    return 'Bagus';
  };

  // Tentukan warna border berdasarkan skor
  const getBorderColor = (score) => {
    if (score < 40) return 'border-red-500';
    if (score < 70) return 'border-yellow-500';
    return 'border-green-500';
  };

  const colorClass = getColor(score);
  const label = getLabel(score);
  const borderColor = getBorderColor(score);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Lingkaran Skor */}
      <div className={`relative w-48 h-48 rounded-full border-8 ${borderColor} flex items-center justify-center bg-gradient-to-br ${colorClass} shadow-2xl`}>
        {/* Background gelap di dalam */}
        <div className="absolute inset-2 rounded-full bg-gray-950 flex items-center justify-center">
          {/* Angka Skor */}
          <div className="text-center">
            <div className="text-6xl font-bold text-white">{Math.round(score)}</div>
            <div className="text-sm text-gray-400 mt-1">/ 100</div>
          </div>
        </div>
      </div>

      {/* Label Status */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">
          Status Iklan: <span className={`${getLabel(score) === 'Buruk' ? 'text-red-400' : getLabel(score) === 'Cukup' ? 'text-yellow-400' : 'text-green-400'}`}>
            {label}
          </span>
        </h3>
        <p className="text-gray-400 text-sm">
          {score < 40 && 'Performa iklan memerlukan perbaikan segera'}
          {score >= 40 && score < 70 && 'Performa iklan sudah cukup baik, masih bisa ditingkatkan'}
          {score >= 70 && 'Performa iklan sangat baik! Pertahankan dan tingkatkan budget'}
        </p>
      </div>
    </div>
  );
};

export default ScoreGauge;