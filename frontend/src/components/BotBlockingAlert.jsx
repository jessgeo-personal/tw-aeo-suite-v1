import React, { useState } from 'react';
import { 
  XCircle, 
  AlertTriangle, 
  Shield, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Code
} from 'lucide-react';

// Get base URL for links - works in both local and production
const getBaseUrl = () => {
  // In production, use the current domain
  // In development, it will be localhost:3000
  return window.location.origin;
};

/**
 * BotBlockingAlert Component - Single File Tailwind Version
 * 
 * Displays rich, actionable bot blocking detection results from backend analysis
 * Pure display component - no analysis logic, receives pre-analyzed data
 * 
 * @param {Object} botBlocking - Bot blocking analysis data from backend
 * @param {string} url - The analyzed URL
 */
const BotBlockingAlert = ({ botBlocking, url }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showEvidence, setShowEvidence] = useState(true);

  if (!botBlocking?.isBlocked) {
    return null;
  }

  const {
    blockingType = 'unknown',
    affectedCrawlers = [],
    evidence = {},
    impact,
    recommendation
  } = botBlocking;

  // Format blocking type for display
  const formatBlockingType = (type) => {
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get blocking severity
  const getBlockingSeverity = () => {
    if (blockingType.includes('cloudflare') || blockingType.includes('firewall')) {
      return 'critical';
    }
    if (blockingType.includes('javascript') || blockingType.includes('captcha')) {
      return 'high';
    }
    return 'medium';
  };

  const severity = getBlockingSeverity();

  // Severity-based border colors
  const borderColors = {
    critical: 'border-red-500',
    high: 'border-orange-500',
    medium: 'border-yellow-500'
  };

  const bgGradients = {
    critical: 'from-red-950/30 via-red-900/20 to-red-950/30',
    high: 'from-orange-950/30 via-orange-900/20 to-orange-950/30',
    medium: 'from-yellow-950/30 via-yellow-900/20 to-yellow-950/30'
  };

  return (
    <div className={`bg-gradient-to-br ${bgGradients[severity]} border-2 ${borderColors[severity]} rounded-2xl shadow-2xl overflow-hidden mb-8 animate-pulse-slow`}>
      {/* Alert Header */}
      <div className={`bg-gradient-to-r from-red-500/15 to-red-500/5 px-7 py-6 border-b ${borderColors[severity]}/20 flex items-start gap-5`}>
        <div className="relative flex-shrink-0">
          <XCircle size={40} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          <AlertTriangle size={20} className="absolute -bottom-1 -right-1 text-orange-500 bg-dark-950 rounded-full p-0.5" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3 flex-wrap">
            Bot Blocking Detected
            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              severity === 'critical' ? 'bg-red-500 text-white' :
              severity === 'high' ? 'bg-orange-500 text-white' :
              'bg-yellow-500 text-black'
            }`}>
              {severity}
            </span>
          </h3>
          
          <div className="flex gap-4 flex-wrap items-center">
            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-sm text-gray-300">
              <strong className="text-primary-500 mr-2">Type:</strong>
              {formatBlockingType(blockingType)}
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-xs font-bold text-orange-400">
              ⚠️ Affects AI crawler visibility
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Section */}
      {evidence && Object.keys(evidence).length > 0 && (
        <div className="border-b border-white/5">
          <div 
            className="px-7 py-4.5 bg-black/20 flex justify-between items-center cursor-pointer hover:bg-black/30 transition-colors"
            onClick={() => setShowEvidence(!showEvidence)}
          >
            <h4 className="font-semibold text-white flex items-center gap-2.5">
              <Shield size={18} />
              Evidence of Blocking
            </h4>
            {showEvidence ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </div>
          
          {showEvidence && (
            <div className="px-7 py-5 space-y-5">
              {/* Detected Signatures */}
              {evidence.detectedSignatures && evidence.detectedSignatures.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-400 mb-3">Detected Signatures:</h5>
                  <ul className="space-y-2">
                    {evidence.detectedSignatures.map((sig, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-red-500/10 border-l-3 border-red-500 rounded-md">
                        <Code size={14} className="text-red-400 flex-shrink-0" />
                        <span className="text-red-300 text-sm font-mono">{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* HTTP Status */}
              {evidence.httpStatusCode && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-400 mb-3">HTTP Response:</h5>
                  <div className="px-4 py-3 bg-red-500/10 border-l-3 border-red-500 rounded-md text-sm text-gray-200">
                    Status Code: <code className="bg-white/10 px-2 py-1 rounded font-mono text-red-400 font-semibold">{evidence.httpStatusCode}</code>
                  </div>
                </div>
              )}

              {/* Response Indicators */}
              {evidence.responseIndicators && evidence.responseIndicators.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-400 mb-3">Response Indicators:</h5>
                  <ul className="space-y-1.5">
                    {evidence.responseIndicators.map((indicator, idx) => (
                      <li key={idx} className="px-3 py-2 bg-orange-500/10 border-l-3 border-orange-500 rounded-md text-sm text-orange-200">
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Affected Crawlers */}
      {affectedCrawlers && affectedCrawlers.length > 0 && (
        <div className="border-b border-white/5">
          <div className="px-7 py-4.5 bg-black/20">
            <h4 className="font-semibold text-white flex items-center gap-2.5 mb-4">
              <AlertTriangle size={18} />
              Affected AI Crawlers
            </h4>
          </div>
          <div className="px-7 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {affectedCrawlers.map((crawler, idx) => (
                <div key={idx} className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-colors">
                  <XCircle size={14} />
                  <span>{crawler}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Impact Section */}
      {impact && (
        <div className="border-b border-white/5">
          <div className="px-7 py-4.5 bg-black/20">
            <h4 className="font-semibold text-white flex items-center gap-2.5">
              <AlertTriangle size={18} />
              AEO Impact
            </h4>
          </div>
          <div className="px-7 py-5 space-y-4">
            <p className="text-gray-200 leading-relaxed">{impact}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="px-4 py-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">0%</div>
                <div className="text-xs text-gray-400 font-semibold">AI Citation Rate</div>
              </div>
              <div className="px-4 py-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">100%</div>
                <div className="text-xs text-gray-400 font-semibold">Visibility Loss</div>
              </div>
              <div className="px-4 py-4 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                <div className="text-3xl font-bold text-orange-400 mb-1">High</div>
                <div className="text-xs text-gray-400 font-semibold">Revenue Risk</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Section */}
      {recommendation && (
        <div className="border-b border-white/5">
          <div className="px-7 py-4.5 bg-black/20">
            <h4 className="font-semibold text-white flex items-center gap-2.5">
              <CheckCircle size={18} />
              How to Fix This
            </h4>
          </div>
          <div className="px-7 py-5 space-y-4">
            <p className="px-4 py-3 bg-green-500/10 border-l-3 border-green-500 rounded-lg text-gray-200 leading-relaxed">
              {recommendation}
            </p>
            
            <div className="px-4.5 py-4.5 bg-primary-500/5 border border-primary-500/20 rounded-lg">
              <h5 className="text-sm font-semibold text-primary-400 mb-3.5">Recommended Actions:</h5>
              <ol className="space-y-3 pl-5 list-decimal text-sm text-gray-200 leading-relaxed">
                <li>
                  <strong className="text-primary-400 mr-1">Review Bot Management Settings:</strong>
                  Check your WAF, CDN, or security plugin configurations for aggressive bot blocking rules.
                </li>
                <li>
                  <strong className="text-primary-400 mr-1">Whitelist AI Crawlers:</strong>
                  Add verified AI crawler user-agents (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) to your allowlist.
                </li>
                <li>
                  <strong className="text-primary-400 mr-1">Test Accessibility:</strong>
                  Use our bot analysis tool to verify AI crawlers can now access your site.
                </li>
                <li>
                  <strong className="text-primary-400 mr-1">Monitor Results:</strong>
                  Track citation improvements in AI search results over 2-4 weeks.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Technical Details (Collapsible) */}
      <div className="border-b border-white/5">
        <div 
          className="px-7 py-4.5 bg-black/20 flex justify-between items-center cursor-pointer hover:bg-black/30 transition-colors"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
        >
          <h4 className="font-semibold text-white flex items-center gap-2.5">
            <Code size={18} />
            Technical Details
          </h4>
          {showTechnicalDetails ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
        
        {showTechnicalDetails && (
          <div className="px-7 py-5">
            <div className="bg-black/30 px-4 py-4 rounded-lg border border-white/10 space-y-2.5">
              <div className="flex justify-between items-start py-2.5 border-b border-white/5 gap-4">
                <span className="text-sm text-gray-400 font-semibold flex-shrink-0">Analyzed URL:</span>
                <span className="text-sm text-gray-200 font-mono text-right break-all">{url}</span>
              </div>
              <div className="flex justify-between items-start py-2.5 border-b border-white/5 gap-4">
                <span className="text-sm text-gray-400 font-semibold flex-shrink-0">Blocking Mechanism:</span>
                <span className="text-sm text-gray-200 font-mono text-right">{formatBlockingType(blockingType)}</span>
              </div>
              {evidence.httpStatusCode && (
                <div className="flex justify-between items-start py-2.5 border-b border-white/5 gap-4">
                  <span className="text-sm text-gray-400 font-semibold flex-shrink-0">HTTP Response:</span>
                  <span className="text-sm text-gray-200 font-mono text-right">{evidence.httpStatusCode}</span>
                </div>
              )}
              <div className="flex justify-between items-start py-2.5 gap-4">
                <span className="text-sm text-gray-400 font-semibold flex-shrink-0">Affected Platforms:</span>
                <span className="text-sm text-gray-200 font-mono text-right">{affectedCrawlers.join(', ')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-7 py-5 bg-black/20 flex gap-3 flex-wrap">
        <a 
          href={`${getBaseUrl()}/bot-management-guide.html`}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 min-w-[200px] px-6 py-3.5 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-black font-semibold text-sm transition-all hover:shadow-lg hover:shadow-primary-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <FileText size={16} />
          View Bot Management Guide
          <ExternalLink size={14} />
        </a>
        <a 
          href={`${getBaseUrl()}/contact?service=bot-fix`}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 min-w-[200px] px-6 py-3.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold text-sm border border-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <Shield size={16} />
          Get Professional Help
        </a>
      </div>
    </div>
  );
};

export default BotBlockingAlert;