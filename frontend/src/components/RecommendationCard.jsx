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

  const getCategoryColor = (category) => {
    const colors = {
      'Creative': 'bg-pink-900/40 text-pink-300 border-pink-700/50',
      'Budget & Audience': 'bg-amber-900/40 text-amber-300 border-amber-700/50',
      'Distribution': 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
      'Scaling': 'bg-green-900/40 text-green-300 border-green-700/50',
      'Optimization': 'bg-blue-900/40 text-blue-300 border-blue-700/50',
      'General': 'bg-gray-800 text-gray-300 border-gray-700/50',
    };
    return colors[category] || 'bg-gray-800 text-gray-300 border-gray-700/50';
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      {/* Header: Icon + Priority Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getPriorityIcon(recommendation.priority)}
          {recommendation.category && (
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${getCategoryColor(recommendation.category)}`}>
              {recommendation.category}
            </span>
          )}
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
      <div className="text-gray-300 text-sm mb-4 leading-relaxed whitespace-pre-line">
        {recommendation.description}
      </div>

      {/* Tabel Metrik */}
      {recommendation.metrics && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {Object.entries(recommendation.metrics).map(([key, value]) => (
              <div key={key} className="bg-gray-800/80 rounded-lg p-3 text-center">
                <span className="block text-gray-500 font-medium mb-1">{key}</span>
                <span className="block text-white font-bold text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Action (sementara disembunyikan) */}
    </div>
  );
};

export default RecommendationCard;