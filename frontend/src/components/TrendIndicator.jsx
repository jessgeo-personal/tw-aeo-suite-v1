import React from 'react';

const TrendIndicator = ({ trend }) => {
  if (!trend || !trend.hasPreviousAnalysis) {
    return (
      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
        <p className="text-gray-400 text-sm">
          No previous analysis for trend comparison
        </p>
      </div>
    );
  }
  
  const isPositive = trend.trend === 'up';
  const isNegative = trend.trend === 'down';
  const isNeutral = trend.trend === 'same';
  
  const arrowColor = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400';
  const bgColor = isPositive ? 'bg-green-900/20' : isNegative ? 'bg-red-900/20' : 'bg-gray-800/20';
  const borderColor = isPositive ? 'border-green-700' : isNegative ? 'border-red-700' : 'border-gray-700';
  
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">Score Trend (vs. {trend.daysSince} days ago)</p>
          <div className="flex items-center gap-2">
            {isPositive && (
              <svg className={`w-6 h-6 ${arrowColor}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {isNegative && (
              <svg className={`w-6 h-6 ${arrowColor}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {isNeutral && (
              <svg className={`w-6 h-6 ${arrowColor}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`text-2xl font-bold ${arrowColor}`}>
              {isNeutral ? '0' : `${isPositive ? '+' : '-'}${trend.delta}`}
            </span>
            <span className="text-sm text-gray-400">points</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Previous Score</p>
          <p className="text-lg font-semibold text-gray-200">{trend.previousScore}</p>
          <p className="text-xs text-gray-500">{new Date(trend.previousDate).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default TrendIndicator;