import React, { useState } from 'react';
import { ExternalLink, AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

// ===========================================
// SCORE CIRCLE COMPONENT
// ===========================================
const ScoreCircle = ({ score, showDelta = false, previousScore = null }) => {
  const getScoreColor = (s) => {
    if (s >= 80) return '#10b981'; // Green
    if (s >= 50) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const color = getScoreColor(score);
  const delta = previousScore !== null ? score - previousScore : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
        <svg className="w-28 h-28 sm:w-32 sm:h-32 transform -rotate-90">
          <circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" strokeWidth="8" fill="none" />
          <circle
            cx="50%" cy="50%" r="45%"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${(score / 100) * 283} 283`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-4xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      {showDelta && delta !== null && delta !== 0 && (
        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className="w-4 h-4" />
          <span>{delta >= 0 ? '+' : ''}{delta} from last scan</span>
        </div>
      )}
    </div>
  );
};

// ===========================================
// TIPS DISPLAY COMPONENT
// ===========================================
const TipsDisplay = ({ tips }) => {
  if (!tips) return null;
  
  return (
    <div className="flex-1">
      <h4 className="font-semibold text-gray-900 mb-3 text-sm">{tips.title}</h4>
      <ul className="space-y-2">
        {tips.items.map((tip, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="text-cyan-600 mt-0.5 flex-shrink-0">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ===========================================
// SCORE CARD COMPONENT (Category Cards)
// ===========================================
const ScoreCard = ({ label, score, details }) => {
  const getScoreColor = (s) => {
    if (s >= 80) return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
    if (s >= 50) return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
  };

  const colors = getScoreColor(score);

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-3 sm:p-4 min-w-0`}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{label}</span>
        <span className={`text-xl sm:text-2xl font-bold ${colors.text} flex-shrink-0`}>{score}</span>
      </div>
      {details && details.length > 0 && (
        <div className="space-y-1">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs gap-1">
              <span className="text-gray-600 truncate min-w-0 flex-1">{detail.label}</span>
              <span className="text-gray-700 font-medium flex-shrink-0 text-right">{detail.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===========================================
// ISSUE ROW COMPONENT (Expandable)
// ===========================================
const IssueRow = ({ issue, type }) => {
  const [expanded, setExpanded] = useState(false);

  // Calculate potential gain (rough estimate if not provided)
  const potentialGain = issue.potentialGain || calculatePotentialGain(issue);

  return (
    <div className="px-3 sm:px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              {issue.category || getCategoryFromIssue(issue)}
            </span>
            <span className="text-xs text-green-600 font-medium">
              +{potentialGain} pts if fixed
            </span>
          </div>
          <h4 className="font-medium text-gray-900">{issue.title || issue.issue || issue.action}</h4>
          <p className="text-sm text-gray-600 mt-1">{issue.description || issue.action}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="sm:ml-4 text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap self-start"
        >
          {expanded ? 'Hide details' : 'How to fix'}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-3 pl-4 border-l-2 border-blue-200 space-y-2">
          {(issue.context || issue.reference) && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase">Context</span>
              <p className="text-sm text-gray-700 mt-1">{issue.context || issue.reference}</p>
            </div>
          )}
          {issue.example && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase">Example</span>
              <p className="text-sm text-gray-700 mt-1">{issue.example}</p>
            </div>
          )}
          {(issue.fix || issue.implementation) && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase">How to Fix</span>
              <p className="text-sm text-gray-700 mt-1">{issue.fix || issue.implementation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===========================================
// ISSUE SECTION COMPONENT (Collapsible)
// ===========================================
const IssueSection = ({ title, issues, type, isExpanded, onToggle }) => {
  const typeConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: <AlertCircle className="w-5 h-5" />, iconColor: 'text-red-600' },
    high: { bg: 'bg-red-50', border: 'border-red-200', icon: <AlertCircle className="w-5 h-5" />, iconColor: 'text-red-600' },
    errors: { bg: 'bg-red-50', border: 'border-red-200', icon: <AlertCircle className="w-5 h-5" />, iconColor: 'text-red-600' },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertTriangle className="w-5 h-5" />, iconColor: 'text-amber-600' },
    warnings: { bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertTriangle className="w-5 h-5" />, iconColor: 'text-amber-600' },
    low: { bg: 'bg-blue-50', border: 'border-blue-200', icon: <Info className="w-5 h-5" />, iconColor: 'text-blue-600' },
    notices: { bg: 'bg-blue-50', border: 'border-blue-200', icon: <Info className="w-5 h-5" />, iconColor: 'text-blue-600' }
  };

  const config = typeConfig[type] || typeConfig.low;

  if (!issues || issues.length === 0) return null;

  return (
    <div className={`${config.border} border rounded-lg overflow-hidden mb-3`}>
      <button
        onClick={onToggle}
        className={`w-full ${config.bg} px-4 py-3 flex items-center justify-between hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <span className={config.iconColor}>{config.icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
          <span className="bg-white px-2 py-0.5 rounded-full text-xs font-medium text-gray-600">
            {issues.length}
          </span>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {isExpanded && (
        <div className="bg-white divide-y divide-gray-100">
          {issues.map((issue, idx) => (
            <IssueRow key={idx} issue={issue} type={type} />
          ))}
        </div>
      )}
    </div>
  );
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================
function calculatePotentialGain(issue) {
  // Estimate potential score gain based on priority
  if (issue.priority === 'critical' || issue.priority === 'high') return 15;
  if (issue.priority === 'medium') return 8;
  return 3;
}

function getCategoryFromIssue(issue) {
  const text = (issue.issue || issue.action || issue.title || '').toLowerCase();
  if (text.includes('schema') || text.includes('structured data')) return 'Schema';
  if (text.includes('crawl') || text.includes('index') || text.includes('robot')) return 'Crawlability';
  if (text.includes('header') || text.includes('h1') || text.includes('h2') || text.includes('heading')) return 'Structure';
  if (text.includes('alt') || text.includes('accessibility') || text.includes('semantic')) return 'Accessibility';
  if (text.includes('read') || text.includes('content') || text.includes('question')) return 'Content';
  if (text.includes('author') || text.includes('citation') || text.includes('authority')) return 'Authority';
  return 'General';
}

function organizeRecommendationsBySeverity(recommendations) {
  const organized = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  (recommendations || []).forEach(rec => {
    const priority = rec.priority || 'low';
    if (organized[priority]) {
      organized[priority].push(rec);
    } else {
      organized.low.push(rec);
    }
  });

  return organized;
}

// ===========================================
// MAIN RESULTS DISPLAY COMPONENT
// ===========================================
export const EnhancedResultsDisplay = ({ results, toolId, tips }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    high: true,
    medium: true,
    low: true
  });

  // Show empty state with tips if no results
  if (!results) {
    return (
      <div className="mt-6">
        {/* Score + Tips Box - Empty State */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Empty Score Placeholder */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Overall Score
              </h3>
              <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                <svg className="w-28 h-28 sm:w-32 sm:h-32 transform -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-300">--</span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            {tips && <TipsDisplay tips={tips} />}
          </div>
        </div>

        {/* Empty Cards Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((_, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-400">--</span>
                  <span className="text-xl sm:text-2xl font-bold text-gray-300">--</span>
                </div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-6 text-sm">
            Enter a URL and click Analyze to see results
          </p>
        </div>
      </div>
    );
  }

  // Organize recommendations by severity
  const organizedRecs = organizeRecommendationsBySeverity(results.recommendations);
  
  // Count issues
  const criticalCount = organizedRecs.critical.length;
  const highCount = organizedRecs.high.length;
  const errorCount = criticalCount + highCount;
  const warningCount = organizedRecs.medium.length;
  const noticeCount = organizedRecs.low.length;
  const totalIssues = errorCount + warningCount + noticeCount;

  // Get previous score if available (for improvement delta)
  const previousScore = results.previousScore || null;

  // Build category cards data
  const categoryCards = buildCategoryCards(results, toolId);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="mt-6">
      {/* Page URL */}
      <div className="mb-4">
        <a 
          href={results.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs sm:text-sm text-cyan-600 hover:underline flex items-center gap-1 break-all"
        >
          <span className="truncate">{results.url}</span> 
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
        </a>
      </div>

      {/* BOX 1: Overall Score + Tips */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Overall Score */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Overall Score
            </h3>
            <ScoreCircle
              score={results.overallScore}
              showDelta={true}
              previousScore={previousScore}
            />
          </div>

          {/* Tips */}
          {tips && <TipsDisplay tips={tips} />}
        </div>
      </div>

      {/* BOX 2: Category Cards Only */}
      {categoryCards.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {categoryCards.map((card, idx) => (
              <ScoreCard
                key={idx}
                label={card.label}
                score={card.score}
                details={card.details}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {totalIssues > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap overflow-x-auto pb-2 -mx-1 px-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeFilter === 'all'
                ? 'bg-cyan-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All Issues ({totalIssues})
          </button>
          {errorCount > 0 && (
            <button
              onClick={() => setActiveFilter('errors')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeFilter === 'errors'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Errors ({errorCount})
            </button>
          )}
          {warningCount > 0 && (
            <button
              onClick={() => setActiveFilter('warnings')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeFilter === 'warnings'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Warnings ({warningCount})
            </button>
          )}
          {noticeCount > 0 && (
            <button
              onClick={() => setActiveFilter('notices')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeFilter === 'notices'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Notices ({noticeCount})
            </button>
          )}
        </div>
      )}

      {/* Issue Sections */}
      {totalIssues > 0 ? (
        <div>
          {(activeFilter === 'all' || activeFilter === 'errors') && (criticalCount > 0 || highCount > 0) && (
            <>
              {criticalCount > 0 && (
                <IssueSection
                  title="Critical Issues"
                  issues={organizedRecs.critical}
                  type="critical"
                  isExpanded={expandedSections.critical}
                  onToggle={() => toggleSection('critical')}
                />
              )}
              {highCount > 0 && (
                <IssueSection
                  title="High Priority Issues"
                  issues={organizedRecs.high}
                  type="high"
                  isExpanded={expandedSections.high}
                  onToggle={() => toggleSection('high')}
                />
              )}
            </>
          )}
          {(activeFilter === 'all' || activeFilter === 'warnings') && warningCount > 0 && (
            <IssueSection
              title="Warnings"
              issues={organizedRecs.medium}
              type="medium"
              isExpanded={expandedSections.medium}
              onToggle={() => toggleSection('medium')}
            />
          )}
          {(activeFilter === 'all' || activeFilter === 'notices') && noticeCount > 0 && (
            <IssueSection
              title="Notices"
              issues={organizedRecs.low}
              type="low"
              isExpanded={expandedSections.low}
              onToggle={() => toggleSection('low')}
            />
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Great Job!</h3>
          <p className="text-green-700">No issues found. Your page is well-optimized for AI engines.</p>
        </div>
      )}
    </div>
  );
};

// ===========================================
// BUILD CATEGORY CARDS
// ===========================================
function buildCategoryCards(results, toolId) {
  const cards = [];

  // Technical Audit - Schema, Crawlability, Structure, Accessibility
  if (toolId === 'technical' && results.scores) {
    if (results.scores.schema !== undefined) {
      cards.push({
        label: 'Schema',
        score: results.scores.schema,
        details: buildSchemaDetails(results)
      });
    }
    if (results.scores.crawlability !== undefined) {
      cards.push({
        label: 'Crawlability',
        score: results.scores.crawlability,
        details: buildCrawlabilityDetails(results)
      });
    }
    if (results.scores.structure !== undefined) {
      cards.push({
        label: 'Structure',
        score: results.scores.structure,
        details: buildStructureDetails(results)
      });
    }
    if (results.scores.accessibility !== undefined) {
      cards.push({
        label: 'Accessibility',
        score: results.scores.accessibility,
        details: buildAccessibilityDetails(results)
      });
    }
  }

  // Content Quality - Readability, Q&A Patterns, Citation Worthiness, AI Structure
  if (toolId === 'content' && results.scores) {
    if (results.scores.readability !== undefined) {
      cards.push({
        label: 'Readability',
        score: results.scores.readability,
        details: buildReadabilityDetails(results)
      });
    }
    if (results.scores.qaPatterns !== undefined) {
      cards.push({
        label: 'Q&A Patterns',
        score: results.scores.qaPatterns,
        details: buildQAPatternsDetails(results)
      });
    }
    if (results.scores.citationWorthiness !== undefined) {
      cards.push({
        label: 'Citation Worth',
        score: results.scores.citationWorthiness,
        details: buildCitationWorthinessDetails(results)
      });
    }
    if (results.scores.aiStructure !== undefined) {
      cards.push({
        label: 'AI Structure',
        score: results.scores.aiStructure,
        details: buildAIStructureDetails(results)
      });
    }
  }

  // Query Match - Show individual query scores (top 4)
  if (toolId === 'query' && results.queries && results.queries.length > 0) {
    results.queries.slice(0, 4).forEach((query, idx) => {
      cards.push({
        label: `Query ${idx + 1}`,
        score: query.matchScore || 0
      });
    });
  }

  // Visibility - Show top 4 sub-scores
  if (toolId === 'visibility' && results.scores) {
    if (results.scores.citationPotential !== undefined) {
      cards.push({
        label: 'Citation',
        score: results.scores.citationPotential,
        details: buildVisibilityCitationDetails(results)
      });
    }
    if (results.scores.crawlability !== undefined) {
      cards.push({
        label: 'Crawlability',
        score: results.scores.crawlability,
        details: buildVisibilityCrawlabilityDetails(results)
      });
    }
    if (results.scores.extractability !== undefined) {
      cards.push({
        label: 'Extractability',
        score: results.scores.extractability,
        details: buildExtractabilityDetails(results)
      });
    }
    if (results.scores.authority !== undefined) {
      cards.push({
        label: 'Authority',
        score: results.scores.authority,
        details: buildAuthorityDetails(results)
      });
    }
  }

  return cards;
}

// ===========================================
// TECHNICAL AUDIT DETAILS
// ===========================================
function buildSchemaDetails(results) {
  const details = [];
  
  const schemaCount = results.structuredData?.jsonLd?.length || 0;
  details.push({ label: 'Schema Types', value: `${schemaCount} found` });
  
  const hasFAQ = results.structuredData?.jsonLd?.some(s => 
    s['@type'] === 'FAQPage' || (Array.isArray(s['@type']) && s['@type'].includes('FAQPage'))
  );
  details.push({ label: 'FAQ Schema', value: hasFAQ ? 'Present' : 'Missing' });
  
  const hasOrg = results.structuredData?.jsonLd?.some(s => 
    s['@type'] === 'Organization' || (Array.isArray(s['@type']) && s['@type'].includes('Organization'))
  );
  details.push({ label: 'Organization', value: hasOrg ? 'Present' : 'Missing' });
  
  return details;
}

function buildCrawlabilityDetails(results) {
  const details = [];
  
  const isIndexable = !results.meta?.robots?.includes('noindex');
  details.push({ label: 'Indexable', value: isIndexable ? 'Yes' : 'No' });
  
  const hasHTTPS = results.url?.startsWith('https://');
  details.push({ label: 'HTTPS', value: hasHTTPS ? 'Enabled' : 'Disabled' });
  
  const hasCanonical = !!results.meta?.canonical;
  details.push({ label: 'Canonical', value: hasCanonical ? 'Present' : 'Missing' });
  
  return details;
}

function buildStructureDetails(results) {
  const details = [];
  
  const h1Count = results.headers?.h1?.length || 0;
  details.push({ label: 'H1 Tags', value: h1Count === 1 ? '1 (Good)' : `${h1Count} (${h1Count === 0 ? 'Missing' : 'Multiple'})` });
  
  const h2Count = results.headers?.h2?.length || 0;
  details.push({ label: 'H2 Subheadings', value: `${h2Count} found` });
  
  const wordCount = results.contentStats?.wordCount || 0;
  details.push({ label: 'Word Count', value: `${wordCount} words` });
  
  return details;
}

function buildAccessibilityDetails(results) {
  const details = [];
  
  const totalImages = results.images?.total || 0;
  const missingAlt = results.images?.missingAlt || 0;
  const altPercentage = totalImages > 0 ? Math.round(((totalImages - missingAlt) / totalImages) * 100) : 100;
  details.push({ label: 'Image Alt Text', value: `${altPercentage}% covered` });
  
  const hasMain = results.semanticHTML?.hasMain || false;
  details.push({ label: '<main> Element', value: hasMain ? 'Present' : 'Missing' });
  
  const hasArticle = results.semanticHTML?.hasArticle || false;
  const hasSection = results.semanticHTML?.hasSection || false;
  const semanticCount = [hasMain, hasArticle, hasSection].filter(Boolean).length;
  details.push({ label: 'Semantic HTML', value: `${semanticCount}/3 tags` });
  
  return details;
}

// ===========================================
// CONTENT QUALITY DETAILS
// ===========================================
function buildReadabilityDetails(results) {
  const details = [];
  const readability = results.readability;
  
  if (readability?.metrics) {
    const flesch = Math.round(readability.metrics.fleschScore);
    let fleschLabel = flesch >= 60 ? 'Good' : flesch >= 50 ? 'Fair' : 'Hard';
    details.push({ label: 'Flesch Score', value: `${flesch} (${fleschLabel})` });
    
    const avgSentence = Math.round(readability.metrics.avgWordsPerSentence);
    details.push({ label: 'Avg Sentence', value: `${avgSentence} words` });
    
    const avgParagraph = Math.round(readability.metrics.avgWordsPerParagraph);
    let paraLabel = avgParagraph <= 100 ? 'Good' : avgParagraph <= 150 ? 'Fair' : 'Long';
    details.push({ label: 'Avg Paragraph', value: `${avgParagraph} words (${paraLabel})` });
  }
  
  return details;
}

function buildQAPatternsDetails(results) {
  const details = [];
  const qaPatterns = results.qaPatterns;
  
  if (qaPatterns) {
    const qCount = qaPatterns.questionHeaders?.count || 0;
    details.push({ label: 'Question Headers', value: `${qCount} found` });
    
    const hasFAQ = qaPatterns.hasFAQSection || false;
    details.push({ label: 'FAQ Section', value: hasFAQ ? 'Present' : 'Missing' });
    
    const directCount = qaPatterns.directAnswers?.count || 0;
    details.push({ label: 'Direct Answers', value: `${directCount} patterns` });
  }
  
  return details;
}

function buildCitationWorthinessDetails(results) {
  const details = [];
  const citation = results.citationWorthiness;
  
  if (citation) {
    const hasAuthor = citation.authoritySignals?.hasAuthor || false;
    details.push({ label: 'Author Attribution', value: hasAuthor ? 'Present' : 'Missing' });
    
    const hasDate = citation.authoritySignals?.hasPublishDate || false;
    details.push({ label: 'Publish Date', value: hasDate ? 'Present' : 'Missing' });
    
    const hasSources = citation.sources || false;
    details.push({ label: 'External Sources', value: hasSources ? 'Cited' : 'Not cited' });
  }
  
  return details;
}

function buildAIStructureDetails(results) {
  const details = [];
  const structure = results.aiStructure;
  
  if (structure) {
    const hasOpening = structure.firstParagraph?.isOptimized || false;
    details.push({ label: 'Strong Opening', value: hasOpening ? 'Yes' : 'No' });
    
    const hasSummary = structure.hasSummary || false;
    details.push({ label: 'Summary Section', value: hasSummary ? 'Present' : 'Missing' });
    
    const hasConclusion = structure.hasConclusion || false;
    details.push({ label: 'Conclusion', value: hasConclusion ? 'Present' : 'Missing' });
  }
  
  return details;
}

// ===========================================
// AI VISIBILITY DETAILS
// ===========================================
function buildVisibilityCitationDetails(results) {
  const details = [];
  const citation = results.citationPotential;
  
  if (citation) {
    const quotableCount = citation.quotableSentences?.count || 0;
    const quotableRatio = citation.quotableSentences?.ratio || 0;
    details.push({ label: 'Quotable Sentences', value: `${quotableCount} (${quotableRatio}%)` });
    
    const density = citation.factualDensity || 0;
    let densityLabel = density >= 3 ? 'High' : density >= 2 ? 'Medium' : 'Low';
    details.push({ label: 'Factual Density', value: `${density} (${densityLabel})` });
    
    const directCount = citation.directAnswers?.count || 0;
    details.push({ label: 'Direct Answers', value: `${directCount} found` });
  }
  
  return details;
}

function buildVisibilityCrawlabilityDetails(results) {
  const details = [];
  const crawl = results.aiCrawlability;
  
  if (crawl) {
    const isIndexable = crawl.isIndexable || false;
    details.push({ label: 'Indexable', value: isIndexable ? 'Yes' : 'No' });
    
    const hasHTTPS = crawl.hasHTTPS || false;
    details.push({ label: 'HTTPS', value: hasHTTPS ? 'Enabled' : 'Disabled' });
    
    const hasCanonical = crawl.hasCanonical || false;
    details.push({ label: 'Canonical Tag', value: hasCanonical ? 'Present' : 'Missing' });
  }
  
  return details;
}

function buildExtractabilityDetails(results) {
  const details = [];
  const extract = results.extractability;
  
  if (extract) {
    const hasMain = extract.semanticHTML?.hasMain || false;
    const hasArticle = extract.semanticHTML?.hasArticle || false;
    const semanticStatus = hasMain ? '<main> present' : hasArticle ? '<article> present' : 'Missing';
    details.push({ label: 'Semantic HTML', value: semanticStatus });
    
    const qHeaders = extract.headers?.questionStyle || 0;
    details.push({ label: 'Question Headers', value: `${qHeaders} found` });
    
    const listCount = (extract.lists?.ul || 0) + (extract.lists?.ol || 0);
    let listLabel = listCount >= 3 ? 'Good' : listCount >= 1 ? 'Few' : 'None';
    details.push({ label: 'Lists', value: `${listCount} (${listLabel})` });
  }
  
  return details;
}

function buildAuthorityDetails(results) {
  const details = [];
  const authority = results.authority;
  
  if (authority) {
    const hasAuthor = authority.authorship?.hasAuthor || false;
    details.push({ label: 'Author Info', value: hasAuthor ? 'Present' : 'Missing' });
    
    const sourceCount = authority.sources?.count || 0;
    let sourceLabel = sourceCount >= 5 ? 'Good' : sourceCount >= 2 ? 'Few' : 'Missing';
    details.push({ label: 'External Sources', value: `${sourceCount} (${sourceLabel})` });
    
    const wordCount = authority.contentDepth || 0;
    let depthLabel = wordCount >= 800 ? 'Good' : wordCount >= 600 ? 'Fair' : 'Thin';
    details.push({ label: 'Content Depth', value: `${wordCount} words (${depthLabel})` });
  }
  
  return details;
}

export default EnhancedResultsDisplay;