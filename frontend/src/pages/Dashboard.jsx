import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Download, Sparkles, RefreshCw, HelpCircle } from 'lucide-react';
import ImprovedAnalyzerCard from '../components/ImprovedAnalyzerCard';
import UsageBadge from '../components/UsageBadge';
import UserMenu from '../components/UserMenu';
import PricingModal from '../components/PricingModal';
import FairUsePolicyModal from '../components/FairUsePolicyModal';
import StatsBar from '../components/StatsBar';
import GuideModal from '../components/GuideModal';
import { getScoreColor, getGradeColor, formatProcessingTime, formatUrl } from '../utils/helpers';
// At top of Dashboard.jsx (around line 11)
import BotBlockingAlert from '../components/BotBlockingAlert';
// At top with other imports
import SubscriptionPlans from '../components/SubscriptionPlans';
import BillingManagement from '../components/BillingManagement';

const Dashboard = ({ user: userProp, onLogout: onLogoutProp }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result: initialResult } = location.state || {};
  const [result, setResult] = useState(initialResult);
  const [analysisId, setAnalysisId] = useState(initialResult?.analysisId || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingModalTab, setPricingModalTab] = useState('subscription');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideModalTab, setGuideModalTab] = useState('business');
  const [showFairUseModal, setShowFairUseModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [user, setUser] = useState(userProp); // Initialize from prop
  const [usage, setUsage] = useState(result?.usage || null); // Track usage separately
  // Around line 22, with other state declarations
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showBillingManagement, setShowBillingManagement] = useState(false);

  // Fetch user data and usage on component mount
  React.useEffect(() => {
    const fetchUserAndUsage = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/auth/session`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Update usage from session data
          if (data.usage) {
            setUsage(data.usage);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUserAndUsage();
  }, []);

  // Handle subscription success/cancel redirect from Stripe
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const subscriptionStatus = params.get('subscription');
    
    if (subscriptionStatus === 'success') {
      // Show success message
      alert('🎉 Welcome to Pro! Your subscription is now active. Refreshing your account...');
      
      // Force refresh user data to get updated subscription
      const refreshUser = async () => {
        try {
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
          const response = await fetch(`${API_URL}/api/auth/session`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            console.log('User subscription updated:', data.user?.subscription);
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      };
      
      refreshUser();
      
      // Redirect to home page after brief delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
      
    } else if (subscriptionStatus === 'cancelled') {
      // User cancelled checkout
      alert('Checkout cancelled. You can upgrade anytime!');
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);
 

  // Logout handler
  const handleLogout = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      onLogoutProp(); // Clear user in App.js
      navigate('/'); // Navigate to landing page
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/'); // Still navigate even if logout call fails
    }
  };

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

  const { results } = result;
  const { 
    url, 
    overallScore, 
    overallGrade, 
    analyzers = {}, 
    recommendations = [], 
    processingTime = 0, 
    weights = {
      technicalFoundation: 0.25,
      contentStructure: 0.25,
      pageLevelEEAT: 0.20,
      queryMatch: 0.15,
      aiVisibility: 0.15
    }
  } = results || {};
  
  // Use usage from state (updated from session) or fallback to result.usage
  const currentUsage = usage || result.usage;
  
  // Check if there's an error (bot blocking, etc.)
  const analysisError = result.error || null;
  
  // DEBUG: Log error data to see what we're receiving
  if (analysisError) {
    console.log('🐛 Analysis Error Data:', JSON.stringify(analysisError, null, 2));
    console.log('🐛 Block Detection:', analysisError.blockDetection);
  }

  // Determine which band the score falls into
  const getScoreBand = (score) => {
    if (score >= 90) return { grade: 'A', color: 'bg-green-500', label: 'A (90-100)' };
    if (score >= 80) return { grade: 'B', color: 'bg-blue-500', label: 'B (80-89)' };
    if (score >= 70) return { grade: 'C', color: 'bg-yellow-500', label: 'C (70-79)' };
    if (score >= 60) return { grade: 'D', color: 'bg-orange-500', label: 'D (60-69)' };
    return { grade: 'F', color: 'bg-red-500', label: 'F (0-59)' };
  };

  const handleExportPDF = async (type) => {
    try {
      setIsExporting(true);
      
      // Check if we have an analysisId
      if (!analysisId) {
        throw new Error('Analysis ID not found. Please run a new analysis.');
      }
      
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          analysisId: analysisId,  // Use the stored analysisId
          type
        })
      });
        
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Export failed');
      }
        
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aeo-report-${type}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
        
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. ' + error.message);
    } finally {
      setIsExporting(false);
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

      const data = await response.json();
      
      // Handle both success and bot blocking cases
      if (data.success) {
        // Update the result state with new analysis
        setResult({
          results: data.results,
          usage: data.usage,
          analysisId: data.analysisId  // Store the analysisId
        });
        setAnalysisId(data.analysisId);  // Update analysisId state
      } else if (data.error) {
        // Bot blocking or other analysis error
        setResult({
          results: results,  // Keep existing results for display
          usage: data.usage || usage,
          error: data  // Store full error object with blockDetection
        });
      } else {
        alert('Refresh failed: Unknown error');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      alert('Failed to refresh analysis. Network error - please check your connection.');
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
            {currentUsage && (
              <UsageBadge current={currentUsage.current} limit={currentUsage.limit} />
            )}
            <button
              onClick={() => {
                setPricingModalTab('subscription');
                //setShowPricingModal(true);
                setShowSubscriptionPlans(true);
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
            {/* User Menu with Email and Logout */}
            <UserMenu 
              user={user} 
              onLogout={handleLogout}
              onManageSubscription={() => setShowBillingManagement(true)}
              onUpgrade={() => setShowSubscriptionPlans(true)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white font-medium rounded-lg transition-colors border border-dark-700"
          >
            <ArrowLeft size={20} />
            <span>New Analysis</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white font-medium rounded-lg transition-colors text-sm border border-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Analysis'}
          </button>
          {/* PDF Export Buttons - Pro Feature */}
          {user && (user.subscription?.type === 'pro' || user.subscription?.type === 'enterprise') && (
            <>
              <button
                onClick={() => handleExportPDF('summary')}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                <Download size={16} />
                Summary PDF
              </button>
              <button
                onClick={() => handleExportPDF('detailed')}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                <Download size={16} />
                Detailed PDF
              </button>
            </>
          )}
        </div>

        {/* Analysis Summary Bar */}
        <div className="mb-6 bg-dark-800/50 border border-dark-700 rounded-lg px-5 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {/* URL */}
            <div className="flex items-center gap-2">
              <ExternalLink size={14} className="text-primary-500" />
              <span className="text-gray-400">Analyzing:</span>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white font-medium hover:text-primary-500 transition-colors max-w-md truncate"
              >
                {formatUrl(url)}
              </a>
            </div>

            {/* Separator */}
            <div className="hidden sm:block w-px h-4 bg-dark-600"></div>

            {/* Date/Time */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-400">Analyzed:</span>
              <span className="text-white font-medium">
                {new Date(results.timestamp || Date.now()).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {/* Separator */}
            <div className="hidden sm:block w-px h-4 bg-dark-600"></div>

            {/* Processing Time */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-gray-400">Completed in:</span>
              <span className="text-white font-medium">{formatProcessingTime(processingTime)}</span>
            </div>

            {/* Separator */}
            <div className="hidden sm:block w-px h-4 bg-dark-600"></div>

            {/* Status Summary */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-400">Status:</span>
              <span className={`font-bold ${
                overallScore >= 90 ? 'text-green-400' :
                overallScore >= 70 ? 'text-blue-400' :
                overallScore >= 50 ? 'text-yellow-400' :
                overallScore >= 30 ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {analysisError ? 'CRITICAL - Bot Blocking' :
                 overallScore >= 90 ? 'EXCELLENT' :
                 overallScore >= 70 ? 'GOOD' :
                 overallScore >= 50 ? 'NEEDS WORK' :
                 overallScore >= 30 ? 'POOR' :
                 'CRITICAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Bot Blocking Alert - BotBlockingAlert Component */}
        {analysisError && analysisError.blockDetection && analysisError.blockDetection.isBlocked && (
          <BotBlockingAlert 
            url={url}
            botBlocking={analysisError.blockDetection}
          />
        )}

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

            {/* Trend Indicator - Pro Feature */}
            {result.trend && (user?.subscription?.type === 'pro' || user?.subscription?.type === 'enterprise') && (
              <div className={`${
                result.trend.trend === 'up' ? 'bg-green-900/20 border-green-700' :
                result.trend.trend === 'down' ? 'bg-red-900/20 border-red-700' :
                'bg-gray-800/20 border-gray-700'
              } border rounded-lg p-4 mt-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Score Trend (vs. {result.trend.daysSince} days ago)
                    </p>
                    <div className="flex items-center gap-2">
                      {result.trend.trend === 'up' && (
                        <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {result.trend.trend === 'down' && (
                        <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {result.trend.trend === 'same' && (
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-2xl font-bold ${
                        result.trend.trend === 'up' ? 'text-green-400' :
                        result.trend.trend === 'down' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {result.trend.trend === 'same' ? '0' : `${result.trend.trend === 'up' ? '+' : '-'}${result.trend.delta || '0'}`}
                      </span>
                      <span className="text-sm text-gray-400">points</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Previous Score</p>
                    <p className="text-lg font-semibold text-gray-200">{result.trend.previousScore}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(result.trend.previousDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
            {/* Query Match Warning - No Keywords Provided */}
            {analyzers.queryMatch && analyzers.queryMatch.grade === 'N/A' && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">ℹ️</span>
                  <div>
                    <h4 className="font-semibold text-yellow-200 mb-1">No Keywords Provided</h4>
                    <p className="text-yellow-200/80 text-sm">
                      Query Match analysis requires target keywords. Run a new analysis with keywords to see query relevance scores.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {analyzers && Object.entries(analyzers).map(([key, data]) => (
              <ImprovedAnalyzerCard
                key={key}
                analyzerKey={key}
                analyzerData={data}
                weight={weights[key]}
                hasError={!!analysisError}
              />
            ))}
          </div>
        </div>

        {/* Site-Level E-E-A-T - Pro Feature */}
        {analyzers.siteLevelEEAT && (user?.subscription?.type === 'pro' || user?.subscription?.type === 'enterprise') ? (
          <div className="mb-8 bg-dark-900 rounded-lg p-6 border border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  Site-Level E-E-A-T
                  <span className="px-2 py-1 bg-sky-600 text-white text-xs rounded-full">PRO</span>
                </h3>
                <p className="text-sm text-gray-400 mt-1">Domain-wide trust and authority signals</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white">{analyzers.siteLevelEEAT.score}</div>
                <div className="text-sm text-gray-400">Grade: {analyzers.siteLevelEEAT.grade}</div>
              </div>
            </div>
            
            {/* Coming Soon Banner */}
            {analyzers.siteLevelEEAT.findings?.authorityMetrics?.details?.status === 'Coming Soon' && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-yellow-200 mb-2">🚀 Domain Authority Metrics - Coming Soon</h4>
                <p className="text-sm text-yellow-200/80 mb-3">
                  We're adding direct integrations with leading SEO platforms:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-dark-800 rounded p-3">
                    <div className="font-semibold text-white mb-1">Moz DA</div>
                    <div className="text-gray-400">0-100 link authority scale</div>
                  </div>
                  <div className="bg-dark-800 rounded p-3">
                    <div className="font-semibold text-white mb-1">Ahrefs DR</div>
                    <div className="text-gray-400">0-100 backlink strength</div>
                  </div>
                  <div className="bg-dark-800 rounded p-3">
                    <div className="font-semibold text-white mb-1">Semrush AS</div>
                    <div className="text-gray-400">0-100 overall authority</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Key Findings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-dark-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">SSL/HTTPS</h4>
                <div className="flex items-center gap-2">
                  {analyzers.siteLevelEEAT.findings?.domainAge?.details?.hasSSL ? (
                    <>
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-400 font-semibold">Enabled</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-400 font-semibold">Missing</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-dark-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Trust Pages Found</h4>
                <div className="text-2xl font-bold text-white">
                  {analyzers.siteLevelEEAT.findings?.siteStructure?.details?.keyPagesFound?.length || 0}/5
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {analyzers.siteLevelEEAT.findings?.siteStructure?.details?.keyPagesFound?.join(', ') || 'None'}
                </p>
              </div>
            </div>
            
            {/* Top Recommendations */}
            {analyzers.siteLevelEEAT.recommendations && analyzers.siteLevelEEAT.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Top Recommendations</h4>
                {analyzers.siteLevelEEAT.recommendations.slice(0, 3).map((rec, idx) => (
                  <div key={idx} className="bg-dark-800 rounded p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                        rec.priority === 'critical' ? 'bg-red-600 text-white' :
                        rec.priority === 'high' ? 'bg-orange-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {rec.priority?.toUpperCase()}
                      </span>
                      <p className="text-gray-200">{typeof rec === 'string' ? rec : rec.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !analyzers.siteLevelEEAT && (user?.subscription?.type === 'free' || !user) ? (
          <div className="mb-8 bg-gradient-to-r from-sky-900/40 to-purple-900/40 rounded-lg p-6 border border-sky-700">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-sky-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-1">
                  Unlock Site-Level E-E-A-T Analysis
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  Upgrade to Pro to analyze your entire domain's trust signals, not just individual pages.
                </p>
                <button 
                  onClick={() => {
                    setPricingModalTab('subscription');
                    //setShowPricingModal(true);
                    setShowSubscriptionPlans(true);
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Upgrade to Pro →
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
            onClick={() => handleExportPDF('summary')}
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

      {/* Subscription Plans Modal - Stripe Integration */}
      {showSubscriptionPlans && (
        <SubscriptionPlans
          currentUser={user}
          onClose={() => setShowSubscriptionPlans(false)}
        />
      )}

      {/* Pricing Modal - Keep for Professional Services */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        initialTab={pricingModalTab}
        user={user}
      />
      {/* Subscription Plans Modal - Stripe */}
      {showSubscriptionPlans && (
        <SubscriptionPlans
          currentUser={user}
          onClose={() => setShowSubscriptionPlans(false)}
        />
      )}

      {/* Billing Management Modal - Stripe */}
      {showBillingManagement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Subscription</h2>
                <button
                  onClick={() => setShowBillingManagement(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <BillingManagement
                currentUser={user}
                onRefresh={() => {
                  setShowBillingManagement(false);
                  setShowSubscriptionPlans(true);
                }}
              />
            </div>
          </div>
        </div>
      )}
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