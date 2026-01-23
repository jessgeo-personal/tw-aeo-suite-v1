import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, FileText, Award, Search, Eye } from 'lucide-react';
import { getScoreColor, getGradeColor, getAnalyzerDisplayName } from '../utils/helpers';

const iconMap = {
  technicalFoundation: Code2,
  contentStructure: FileText,
  pageLevelEEAT: Award,
  queryMatch: Search,
  aiVisibility: Eye,
};

const AnalyzerCard = ({ analyzerKey, analyzerData, weight }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!analyzerData) return null;

  const Icon = iconMap[analyzerKey] || FileText;
  const { score, grade, findings, recommendations, details } = analyzerData;

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden hover:border-dark-600 transition-colors">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-dark-750 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-500" />
          </div>
          
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white mb-1">
              {getAnalyzerDisplayName(analyzerKey)}
            </h3>
            <p className="text-sm text-dark-400">
              Weight: {(weight * 100).toFixed(0)}% of overall score
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Score */}
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            <div className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(grade)}`}>
              Grade {grade}
            </div>
          </div>

          {/* Expand icon */}
          <div className="text-dark-400">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-dark-700">
          {/* Score breakdown */}
          {details && details.breakdown && (
            <div className="mt-4 mb-6 space-y-3">
              <h4 className="text-sm font-semibold text-dark-300 uppercase tracking-wide">
                Score Breakdown
              </h4>
              {Object.entries(details.breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-dark-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-dark-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${(value.score / value.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white w-16 text-right">
                      {value.score}/{value.max}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Key findings */}
          {findings && Object.keys(findings).length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-dark-300 uppercase tracking-wide mb-3">
                Key Findings
              </h4>
              <div className="space-y-2">
                {Object.entries(findings).map(([key, value]) => {
                  if (typeof value === 'object' && value.details) {
                    return (
                      <div key={key} className="bg-dark-900 rounded-lg p-3">
                        <div className="text-sm font-medium text-white mb-2 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-xs text-dark-400 space-y-1">
                          {Object.entries(value.details).map(([detailKey, detailValue]) => (
                            <div key={detailKey} className="flex justify-between">
                              <span className="capitalize">
                                {detailKey.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className="font-mono">
                                {typeof detailValue === 'boolean'
                                  ? detailValue ? '✓ Yes' : '✗ No'
                                  : String(detailValue)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-dark-300 uppercase tracking-wide mb-3">
                Recommendations ({recommendations.length})
              </h4>
              <div className="space-y-2">
                {recommendations.slice(0, 5).map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2 p-3 bg-dark-900 rounded-lg text-sm text-dark-300"
                  >
                    <span className="text-primary-500 font-bold">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyzerCard;
