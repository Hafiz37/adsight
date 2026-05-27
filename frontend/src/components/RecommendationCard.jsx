import React from 'react';

const RecommendationCard = ({ 
  recommendation, 
  onAnalyzeAgain 
}) => {
  // Tentukan ikon dan warna berdasarkan priority
  const getPriorityIcon = (priority) => {
    if (priority === 'high') {
      return (
        <div className="text-3xl">⚠️</div>
      );
    }
    if (priority === 'medium') {
      return (
        <div className="text-3xl">⚡</div>
      );
    }
    return (
      <div className="text-3xl">✨</div>
    );
  };

  // Tentukan warna badge berdasarkan priority
  const getPriorityBadgeColor = (priority) => {
    if (priority === 'high') return 'bg-red-900 text-red-200 border-red-700';
    if (priority === 'medium') return 'bg-yellow-900 text-yellow-200 border-yellow-700';
    return 'bg-blue-900 text-blue-200 border-blue-700';
  };

  // Tentukan label priority
  const getPriorityLabel = (priority) => {
    if (priority === 'high') return 'Prioritas Tinggi';
    if (priority === 'medium') return 'Prioritas Sedang';
    return 'Prioritas Rendah';
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      {/* Header: Icon + Priority Badge */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {getPriorityIcon(recommendation.priority)}
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getPriorityBadgeColor(recommendation.priority)}`}>
          {getPriorityLabel(recommendation.priority)}
        </span>
      </div>

      {/* Judul/Saran */}
      <h4 className="text-lg font-bold text-white mb-2">
        {recommendation.title}
      </h4>

      {/* Deskripsi */}
      <p className="text-gray-300 text-sm mb-4 leading-relaxed">
        {recommendation.description}
      </p>

      {/* Tabel Metrik (jika ada) */}
      {recommendation.metrics && (
        <div className="bg-gray-800 rounded-lg p-3 mb-4 text-xs text-gray-300">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(recommendation.metrics).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-semibold">{key}:</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Action */}
      <div className="flex gap-3">
        <button
          onClick={() => onAnalyzeAgain && onAnalyzeAgain()}
          className="flex-1 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
        >
          Perbaiki Sekarang
        </button>
      </div>
    </div>
  );
};

export default RecommendationCard;