import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Download, Sparkles, RefreshCw, HelpCircle } from 'lucide-react';
import ImprovedAnalyzerCard from '../components/ImprovedAnalyzerCard';
import UsageBadge from '../components/UsageBadge';
import PricingModal from '../components/PricingModal';
import FairUsePolicyModal from '../components/FairUsePolicyModal';
import StatsBar from '../components/StatsBar';
import GuideModal from '../components/GuideModal';
import { getScoreColor, getGradeColor, formatProcessingTime, formatUrl } from '../utils/helpers';


const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result: initialResult } = location.state || {};
  const [result, setResult] = useState(initialResult);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingModalTab, setPricingModalTab] = useState('subscription');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideModalTab, setGuideModalTab] = useState('business');
  const [showFairUseModal, setShowFairUseModal] = useState(false);

  if (!result) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-dark-400 mb-4">No analysis data found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { results, usage } = result;
  const { url, overallScore, overallGrade, analyzers, recommendations, processingTime, weights } = results;

  // Determine which band the score falls into
  const getScoreBand = (score) => {
    if (score >= 90) return { grade: 'A', color: 'bg-green-500', label: 'A (90-100)' };
    if (score >= 80) return { grade: 'B', color: 'bg-blue-500', label: 'B (80-89)' };
    if (score >= 70) return { grade: 'C', color: 'bg-yellow-500', label: 'C (70-79)' };
    if (score >= 60) return { grade: 'D', color: 'bg-orange-500', label: 'D (60-69)' };
    return { grade: 'F', color: 'bg-red-500', label: 'F (0-59)' };
  };

  const handleExport = () => {
    // Check if user has subscription (you'd get this from user context/state)
    const hasSubscription = false; // TODO: Get from auth context
    
    if (hasSubscription) {
      window.print();
    } else {
      setShowPricingModal(true);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          url: results.url,
          targetKeywords: results.targetKeywords || []
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the result state with new analysis
        setResult({
          results: data.results,
          usage: data.usage
        });
      } else {
        alert('Refresh failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Refresh error:', error);
      alert('Failed to refresh analysis. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      {/* Stats Bar */}
      <StatsBar />
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <header className="border-b border-dark-800 sticky top-0 bg-dark-950/80 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary-500" />
            <img 
              src="/AEO-thatworkx-logo.svg" 
              alt="AEO Suite by Thatworkx" 
              className="h-16"
            />
          </div>

          <div className="flex items-center gap-4">
            {usage && (
              <UsageBadge current={usage.current} limit={usage.limit} />
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white font-medium rounded-lg transition-colors text-sm border border-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Analysis'}
            </button>
            <button
              onClick={() => {
                setPricingModalTab('subscription');
                setShowPricingModal(true);
              }}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Upgrade to Pro
            </button>
            {/* Help/Documentation Button */}
            <button
              onClick={() => {
                setGuideModalTab('business');
                setShowGuideModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-100 font-medium rounded-lg transition-colors border border-dark-700"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Documentation</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Analysis Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white font-medium rounded-lg transition-colors border border-dark-700"
          >
            <ArrowLeft size={20} />
            <span>New Analysis</span>
          </button>
        </div>

        {/* Overall Score Card - FIXED GRADE DISPLAY */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="text-sm text-dark-400 mb-2 flex items-center gap-2">
                  <ExternalLink size={14} />
                  <span>{formatUrl(url)}</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Analysis Complete
                </h2>
                <p className="text-dark-400">
                  Processed in {formatProcessingTime(processingTime)}
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm text-dark-400 mb-2">Overall Score</div>
                <div className={`text-6xl font-bold ${getScoreColor(overallScore)} mb-2`}>
                  {overallScore}
                </div>
                <div className={`inline-block px-4 py-2 rounded-full text-lg font-bold ${getGradeColor(overallGrade)}`}>
                  Grade {overallGrade}
                </div>
              </div>
            </div>

            {/* FIXED: Discrete grade bands with clear indicator */}
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {[
                  { grade: 'F', min: 0, max: 59, color: 'bg-red-500' },
                  { grade: 'D', min: 60, max: 69, color: 'bg-orange-500' },
                  { grade: 'C', min: 70, max: 79, color: 'bg-yellow-500' },
                  { grade: 'B', min: 80, max: 89, color: 'bg-blue-500' },
                  { grade: 'A', min: 90, max: 100, color: 'bg-green-500' },
                ].map((band) => {
                  const isActive = overallScore >= band.min && overallScore <= band.max;
                  return (
                    <div key={band.grade} className="relative">
                      <div
                        className={`h-4 rounded transition-all ${
                          isActive ? band.color + ' ring-2 ring-white/50' : 'bg-dark-700'
                        }`}
                      />
                      {isActive && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                          <div className="px-2 py-1 bg-dark-900 border border-dark-600 rounded text-xs font-bold text-white whitespace-nowrap">
                            {overallScore}
                          </div>
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-900"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grade labels */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs text-dark-500">
                <span>F<br/>(0-59)</span>
                <span>D<br/>(60-69)</span>
                <span>C<br/>(70-79)</span>
                <span>B<br/>(80-89)</span>
                <span>A<br/>(90-100)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analyzers Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Detailed Analysis</h3>
            <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-sm font-bold text-green-500">
              ✓ Free Feature
            </span>
          </div>
          <div className="space-y-4">
            {Object.entries(analyzers).map(([key, data]) => (
              <ImprovedAnalyzerCard
                key={key}
                analyzerKey={key}
                analyzerData={data}
                weight={weights[key]}
              />
            ))}
          </div>
        </div>

        {/* Top Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="mb-8">
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Top Recommendations
                </h3>
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-sm font-bold text-green-500">
                  ✓ Free Feature
                </span>
              </div>
              <div className="space-y-3">
                {recommendations.map((rec, idx) => {
                  // Normalize recommendation - handle both string and object formats
                  const text = typeof rec === 'string' ? rec : rec.text || '';
                  const analyzer = typeof rec === 'string' ? 'General' : rec.analyzer || 'General';
                  const priority = typeof rec === 'string' 
                    ? (rec.toUpperCase().includes('CRITICAL') ? 'critical' : 'medium')
                    : rec.priority || 'medium';
                  
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 p-4 rounded-lg ${
                        priority === 'critical'
                          ? 'bg-red-500/10 border border-red-500/30'
                          : priority === 'high'
                          ? 'bg-orange-500/10 border border-orange-500/30'
                          : 'bg-dark-900'
                      }`}
                    >
                      <span className="text-primary-500 font-bold text-lg">
                        {idx + 1}.
                      </span>
                      <div className="flex-1">
                        <div className="text-white mb-1">{text}</div>
                        <div className="text-xs text-dark-500">
                          From: {analyzer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Professional Services CTA */}
              <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">
                      Need help implementing these recommendations?
                    </h4>
                    <p className="text-dark-300 text-sm">
                      Our AEO experts can implement all optimizations for you. Starting at $1,500.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPricingModalTab('services');
                      setShowPricingModal(true);
                    }}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    View Services
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg transition-colors border border-dark-700"
          >
            Analyze Another Website
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Analysis'}
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg transition-colors border border-dark-700 flex items-center gap-2"
          >
            <Download size={20} />
            Export Report
            <span className="px-2 py-0.5 bg-primary-500/10 text-primary-500 text-xs font-bold rounded border border-primary-500/30">
              Pro
            </span>
          </button>
        </div>
      </div>

            {/* Footer */}
      <footer className="border-t border-dark-800 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-primary-500" />
                <h3 className="text-white font-bold">AEO Suite</h3>
              </div>
              <p className="text-dark-400 text-sm mb-4">
                Professional Answer Engine Optimization tools and consulting services.
              </p>
              <p className="text-dark-500 text-xs">
                By Thatworkx Solutions<br />
                Dubai, UAE
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-dark-400">
                <li>
                  <button 
                    onClick={() => navigate('/')}
                    className="hover:text-white transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setPricingModalTab('subscription');
                      setShowPricingModal(true);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </button>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-white font-bold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-dark-400">
                <li>
                  <button 
                    onClick={() => {
                      setPricingModalTab('services');
                      setShowPricingModal(true);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Technical Audit
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setPricingModalTab('services');
                      setShowPricingModal(true);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Content Optimization
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setPricingModalTab('services');
                      setShowPricingModal(true);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Full Implementation
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setPricingModalTab('services');
                      setShowPricingModal(true);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Monthly Retainer
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-bold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-dark-400">
                <li>
                  <a href="mailto:support@thatworkx.com" className="hover:text-white transition-colors">
                    support@thatworkx.com
                  </a>
                </li>
                <li>
                  <a href="https://thatworkx.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    thatworkx.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-dark-800 pt-8 text-center text-sm text-dark-500">
            <div className="flex items-center justify-center gap-4 mb-2">
              <button
                onClick={() => setShowFairUseModal(true)}
                className="hover:text-white transition-colors"
              >
                Fair Use Policy
              </button>
              <span>•</span>
              <a href="mailto:support@thatworkx.com" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
            <p>© 2026 Thatworkx Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        initialTab={pricingModalTab}
      />
      {/* Guide Modal */}
      <GuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        defaultTab={guideModalTab}
      /> 
      {/* Fair Use Policy Modal */}
      <FairUsePolicyModal
        isOpen={showFairUseModal}
        onClose={() => setShowFairUseModal(false)}
      />
    </div>
    </>
  );
};

export default Dashboard;