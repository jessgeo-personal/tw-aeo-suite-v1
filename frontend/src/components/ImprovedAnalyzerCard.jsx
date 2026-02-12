import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, FileText, Award, Search, Eye, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { getScoreColor, getGradeColor, getAnalyzerDisplayName } from '../utils/helpers';

const iconMap = {
  technicalFoundation: Code2,
  contentStructure: FileText,
  pageLevelEEAT: Award,
  queryMatch: Search,
  aiVisibility: Eye,
};

const ImprovedAnalyzerCard = ({ analyzerKey, analyzerData, weight, hasError = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRecs, setExpandedRecs] = useState({});
  
  // If no data and there's an error, show placeholder
  if (!analyzerData) {
    if (hasError) {
      const Icon = iconMap[analyzerKey] || FileText;
      return (
        <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden opacity-60">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6 text-red-500" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {getAnalyzerDisplayName(analyzerKey)}
                </h3>
                <p className="text-sm text-red-400">
                  Unable to analyze due to bot blocking
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-400">N/A</div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const Icon = iconMap[analyzerKey] || FileText;
  const { score, grade, findings, recommendations, details } = analyzerData;

  // Normalize recommendation - handle both string and object formats
  const normalizeRecommendation = (rec) => {
    if (typeof rec === 'string') {
      // Old format: string only
      return {
        text: rec,
        why: '',
        howToFix: '',
        priority: rec.toUpperCase().includes('CRITICAL') ? 'critical' :
                  rec.toUpperCase().includes('HIGH') ? 'high' : 'medium'
      };
    }
    // New format: object with text, why, howToFix, priority
    return rec;
  };

  // Get priority icon based on priority level
  const getPriorityIcon = (priority) => {
    if (priority === 'critical') return AlertCircle;
    if (priority === 'high') return AlertCircle;
    return Info;
  };

  const getPriorityColor = (priority) => {
    if (priority === 'critical') return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (priority === 'high') return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
  };

  const getPriorityLabel = (priority) => {
    if (priority === 'critical') return 'Critical';
    if (priority === 'high') return 'High';
    if (priority === 'medium') return 'Medium';
    return 'Low';
  };

  const toggleRecExpansion = (idx) => {
    setExpandedRecs(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

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
            {/* Special case: Query Match with no keywords */}
            {analyzerKey === 'queryMatch' && grade === 'N/A' ? (
              <>
                <div className="text-lg font-semibold text-dark-400">
                  No queries searched
                </div>
                <div className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold bg-dark-700 text-dark-400">
                  N/A
                </div>
              </>
            ) : (
              <>
                <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </div>
                <div className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(grade)}`}>
                  Grade {grade}
                </div>
              </>
            )}
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
          {/* Score breakdown - HORIZONTAL CARDS */}
          {details && details.breakdown && (
            <div className="mt-6 mb-6">
              <h4 className="text-sm font-semibold text-dark-300 uppercase tracking-wide mb-4">
                Score Breakdown
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(details.breakdown).map(([key, value]) => {
                  const percentage = (value.score / value.max) * 100;
                  return (
                    <div key={key} className="bg-dark-900 rounded-lg p-4 border border-dark-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-lg font-bold text-white">
                          {value.score}/{value.max}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percentage >= 80 ? 'bg-green-500' :
                            percentage >= 60 ? 'bg-blue-500' :
                            percentage >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key findings - SIDE-BY-SIDE CARDS */}
          {findings && Object.keys(findings).length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-dark-300 uppercase tracking-wide mb-4">
                Key Findings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(findings).map(([key, value]) => {
                  // Handle different finding formats
                  if (typeof value === 'object' && value !== null) {
                    return (
                      <div key={key} className="bg-dark-900 border border-dark-700 rounded-lg p-4 hover:border-dark-600 transition-colors">
                        <div className="flex items-start gap-2 mb-3">
                          {value.status === 'good' || value.found ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-white mb-2 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h5>
                            {value.details && typeof value.details === 'object' ? (
                              <div className="space-y-1 text-xs text-dark-400">
                                {Object.entries(value.details).map(([detailKey, detailValue]) => (
                                  <div key={detailKey} className="flex justify-between items-center">
                                    <span className="capitalize">
                                      {detailKey.replace(/([A-Z])/g, ' $1').trim()}:
                                    </span>
                                    <span className="font-mono font-semibold text-white">
                                      {typeof detailValue === 'boolean'
                                        ? detailValue ? '✓' : '✗'
                                        : String(detailValue)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-dark-400">
                                {String(value.message || value.value || '')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Recommendations - EXPANDABLE WITH WHY/HOW */}
          {recommendations && recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-dark-300 uppercase tracking-wide mb-4">
                Recommendations ({recommendations.length})
              </h4>
              <div className="space-y-3">
                {recommendations.map((rec, idx) => {
                  const normalized = normalizeRecommendation(rec);
                  const PriorityIcon = getPriorityIcon(normalized.priority);
                  const priorityColor = getPriorityColor(normalized.priority);
                  const isRecExpanded = expandedRecs[idx];
                  const hasDetails = normalized.why || normalized.howToFix;
                  
                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border ${priorityColor}`}
                    >
                      {/* Main recommendation */}
                      <div className="p-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${priorityColor}`}>
                              <PriorityIcon size={16} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h5 className="text-sm font-semibold text-white">
                                {normalized.text}
                              </h5>
                              <span className={`text-xs font-bold uppercase tracking-wide whitespace-nowrap px-2 py-1 rounded ${priorityColor}`}>
                                {getPriorityLabel(normalized.priority)}
                              </span>
                            </div>
                            
                            {/* Expand/Collapse button if details exist */}
                            {hasDetails && (
                              <button
                                onClick={() => toggleRecExpansion(idx)}
                                className="mt-2 text-xs text-primary-500 hover:text-primary-400 font-semibold flex items-center gap-1 transition-colors"
                              >
                                {isRecExpanded ? (
                                  <>
                                    <ChevronUp size={14} />
                                    Hide details
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown size={14} />
                                    Show why & how to fix
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable details */}
                      {hasDetails && isRecExpanded && (
                        <div className="px-4 pb-4 border-t border-dark-700/50 pt-4 space-y-3">
                          {normalized.why && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                <h6 className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                                  Why This Matters
                                </h6>
                              </div>
                              <p className="text-sm text-dark-300 leading-relaxed">
                                {normalized.why}
                              </p>
                            </div>
                          )}
                          
                          {normalized.howToFix && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                <h6 className="text-xs font-bold text-green-400 uppercase tracking-wide">
                                  How to Fix
                                </h6>
                              </div>
                              <p className="text-sm text-dark-300 leading-relaxed">
                                {normalized.howToFix}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Implementation note */}
              <div className="mt-4 p-3 bg-primary-500/5 border border-primary-500/20 rounded-lg">
                <p className="text-xs text-dark-400">
                  <span className="font-semibold text-primary-500">💡 Need help implementing?</span>{' '}
                  Our professional services team can implement all recommendations for you.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImprovedAnalyzerCard;