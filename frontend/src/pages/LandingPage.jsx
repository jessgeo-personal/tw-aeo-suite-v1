import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2, TrendingUp, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PricingModal from '../components/PricingModal';
import FairUsePolicyModal from '../components/FairUsePolicyModal';
import AuthModal from '../components/AuthModal';
import UsageBadge from '../components/UsageBadge';
import GuideModal from '../components/GuideModal';
import StatsBar from '../components/StatsBar';
import apiService from '../services/api';
import { isValidUrl } from '../utils/helpers';

const LandingPage = ({ user, onUserUpdate }) => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Changed from '' to null to store object
  const [usage, setUsage] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingModalTab, setPricingModalTab] = useState('subscription');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideModalTab, setGuideModalTab] = useState('business');
  const [showFairUseModal, setShowFairUseModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user]);

  const fetchUsage = async () => {
    try {
      const sessionData = await apiService.auth.getSession();
      if (sessionData.authenticated && sessionData.usage) {
        setUsage(sessionData.usage);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');

    // Validate URL
    if (!isValidUrl(url)) {
      setError({ message: 'Please enter a valid URL' });
      return;
    }

    // Check if user is authenticated
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Run analysis
    setLoading(true);
    try {
      const keywordsArray = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const result = await apiService.analysis.runAnalysis(
        url,
        keywordsArray,
        user.email
      );

      // Navigate to dashboard with results
      navigate('/dashboard', { state: { result } });
      } catch (err) {
        // Store full error object to access blocking details
        setError({
          message: err.message || 'Analysis failed',
          blockDetection: err.blockDetection || null,
          aeoImpact: err.aeoImpact || null,
          recommendation: err.recommendation || null
        });
      } finally {
        setLoading(false);
      }
    };

  return (
    <>
    {/* Stats Bar */}
    <StatsBar />
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
      {/* Enhanced Header */}
      <header className="border-b border-dark-800 sticky top-0 bg-dark-950/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
          {/* Logo */}
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary-500" />
              <img 
                src="/AEO-thatworkx-logo.svg" 
                alt="AEO Suite by Thatworkx" 
                className="h-16"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-dark-400 hover:text-white transition-colors text-sm">
                Features
              </a>
              <a href="#benefits" className="text-dark-400 hover:text-white transition-colors text-sm">
                Benefits
              </a>
              <a 
                href="#pricing" 
                onClick={(e) => {
                  e.preventDefault();
                  setPricingModalTab('subscription');
                  setShowPricingModal(true);
                }}
                className="text-dark-400 hover:text-white transition-colors text-sm cursor-pointer"
              >
                Pricing
              </a>
              <a href="#faq" className="text-dark-400 hover:text-white transition-colors text-sm">
                FAQ
              </a>
              <button
                onClick={() => {
                  setGuideModalTab('business');
                  setShowGuideModal(true);
                }}
                className="text-dark-200 hover:text-white transition-colors"
              >
                Documentation 
              </button>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {/*{usage && (
                    <UsageBadge current={usage.current} limit={usage.limit} className="hidden sm:flex" />
                  )} */}
                  <div className="hidden md:block text-sm text-dark-400">{user.email}</div>
                  <button
                    onClick={() => {
                      setPricingModalTab('subscription');
                      setShowPricingModal(true);
                    }}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    Upgrade
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="hidden md:block px-4 py-2 text-dark-400 hover:text-white transition-colors text-sm"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    Get Started
                  </button>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-dark-400 hover:text-white transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-dark-800 pt-4">
              <nav className="flex flex-col gap-4">
                <a href="#features" className="text-dark-400 hover:text-white transition-colors">
                  Features
                </a>
                <a href="#benefits" className="text-dark-400 hover:text-white transition-colors">
                  Benefits
                </a>
                <a 
                  href="#pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPricingModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-dark-400 hover:text-white transition-colors cursor-pointer"
                >
                  Pricing
                </a>
                <a href="#faq" className="text-dark-400 hover:text-white transition-colors">
                  FAQ
                </a>
                <button
                  onClick={() => {
                    setGuideModalTab('business');
                    setShowGuideModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-dark-200 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  Documentation 
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-full text-primary-500 text-sm font-medium mb-6">
            <TrendingUp size={16} />
            Answer Engine Optimization
          </div>
          
          <h2 className="text-5xl font-bold text-white mb-6">
            Optimize for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-500">
              AI Search
            </span>
          </h2>
          
          <p className="text-xl text-dark-400 max-w-2xl mx-auto mb-12">
            Analyze your website's readiness for AI-powered search engines like ChatGPT, Perplexity, and Google AI Overviews.
          </p>

          {/* Analysis Form */}
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter your website URL (e.g., https://example.com)"
                className="w-full px-6 py-4 pr-12 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors text-lg"
                disabled={loading}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500" size={24} />
            </div>

            <div className="relative">
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Target keywords (comma-separated, optional)"
                className="w-full px-6 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="space-y-3">
                {/* Main error message */}
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                  {typeof error === 'string' ? error : error.message}
                </div>

                {/* Bot blocking details (if available) */}
                {error.blockDetection && error.blockDetection.isBlocked && (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg space-y-3">
                    {/* Block Type */}
                    <div className="flex items-start gap-2">
                      <div className="text-orange-500 font-semibold text-sm">
                        🤖 Blocking Type:
                      </div>
                      <div className="text-orange-300 text-sm">
                        {error.blockDetection.blockType}
                      </div>
                    </div>

                    {/* AEO Impact */}
                    {error.aeoImpact && (
                      <div className="flex items-start gap-2">
                        <div className="text-orange-500 font-semibold text-sm">
                          ⚠️ AEO Impact:
                        </div>
                        <div className="text-orange-300 text-sm">
                          {error.aeoImpact}
                        </div>
                      </div>
                    )}

                    {/* Recommendation */}
                    {error.recommendation && (
                      <div className="flex items-start gap-2">
                        <div className="text-orange-500 font-semibold text-sm">
                          💡 Recommendation:
                        </div>
                        <div className="text-orange-300 text-sm">
                          {error.recommendation}
                        </div>
                      </div>
                    )}

                    {/* Evidence */}
                    {error.blockDetection.evidence && error.blockDetection.evidence.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-orange-500/20">
                        <div className="text-orange-500 font-semibold text-xs mb-1">
                          Evidence:
                        </div>
                        <ul className="list-disc list-inside text-orange-300/80 text-xs space-y-1">
                          {error.blockDetection.evidence.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !url}
              className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Analyze Website
                </>
              )}
            </button>
          </form>

          {!user && (
            <p className="mt-6 text-sm text-dark-500">
              Free analysis • No credit card required • Results in ~5 seconds
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            {
              title: 'Technical Foundation',
              description: 'Schema markup, crawlability, HTML structure',
              weight: '25%',
            },
            {
              title: 'Content Structure',
              description: 'Readability, Q&A patterns, factual density',
              weight: '25%',
            },
            {
              title: 'E-E-A-T Signals',
              description: 'Experience, expertise, authoritativeness, trust',
              weight: '20%',
            },
            {
              title: 'Query Match',
              description: 'Keyword presence, answer positioning',
              weight: '15%',
            },
            {
              title: 'AI Visibility',
              description: 'Citation potential, structured answers',
              weight: '15%',
            },
          ].slice(0, 3).map((feature, idx) => (
            <div
              key={idx}
              className="p-6 bg-dark-800/50 border border-dark-700 rounded-xl hover:border-dark-600 transition-colors"
            >
              <div className="text-sm text-primary-500 font-bold mb-2">
                {feature.weight} weight
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-dark-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Optimize for AI Search?
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              AI-powered search engines are transforming how people find information. Get ahead of the curve.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                stat: '60%',
                title: '60% of Searches Use AI',
                description: 'ChatGPT, Perplexity, and Google AI Overviews now handle the majority of informational searches. Traditional SEO isn\'t enough anymore.',
              },
              {
                stat: '5x',
                title: '5x Higher Citation Value',
                description: 'Being cited by AI engines provides more qualified traffic than traditional search results. Users trust AI-recommended sources.',
              },
              {
                stat: '300%',
                title: 'Future-Proof Your Traffic',
                description: 'AI search is growing 300% year-over-year. Websites optimized for AEO maintain visibility as search evolves.',
              },
            ].map((benefit, idx) => (
              <div key={idx} className="bg-dark-800 border border-dark-700 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors">
                <div className="text-5xl font-bold text-primary-500 mb-4">
                  {benefit.stat}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Critical for AEO */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-dark-400">
              Everything you need to know about Answer Engine Optimization
            </p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                q: 'What is Answer Engine Optimization (AEO)?',
                a: 'Answer Engine Optimization is the practice of optimizing your website content to be preferred by AI-powered search engines like ChatGPT, Perplexity, and Google AI Overviews. Unlike traditional SEO which focuses on ranking in search results, AEO focuses on being cited as the authoritative source when AI engines answer user questions.',
              },
              {
                q: 'How does the AEO Suite analyze my website?',
                a: 'Our tool runs 5 comprehensive analyzers: Technical Foundation (schema markup, crawlability), Content Structure (readability, Q&A patterns), E-E-A-T Signals (expertise, authority, trust), Query Match (keyword optimization), and AI Visibility (citation potential). Each analyzer provides a detailed score and actionable recommendations specific to AI search optimization.',
              },
              {
                q: 'What\'s the difference between free and paid plans?',
                a: 'The free plan includes 10 analyses per day with basic recommendations from all 5 analyzers. Pro plans ($20/month) offer unlimited analyses, PDF report exports, advanced insights, trend tracking, and priority support. Professional services ($1,500-$5,000) provide hands-on implementation by our AEO experts.',
              },
              {
                q: 'How long does an analysis take?',
                a: 'Each analysis completes in 3-5 seconds. Our system analyzes your page structure, content quality, technical implementation, and AI visibility factors in real-time, providing immediate feedback on your AEO readiness.',
              },
              {
                q: 'Can you implement the recommendations for me?',
                a: 'Yes! We offer professional services ranging from $1,500 for content optimization to $5,000 for complete AEO implementation. This includes technical audits, schema markup implementation, content optimization, and ongoing monitoring. We also offer monthly retainers at $150/month for continuous optimization.',
              },
              {
                q: 'How is AEO different from traditional SEO?',
                a: 'Traditional SEO focuses on ranking in search engine results pages (SERPs). AEO focuses on being cited by AI engines that provide direct answers. This requires different optimization strategies: structured data for AI understanding, question-answer formatting, factual density, and E-E-A-T signals that AI engines prioritize.',
              },
              {
                q: 'Which AI search engines does this optimize for?',
                a: 'Our tool optimizes for all major AI search engines including ChatGPT (with web browsing), Perplexity AI, Google AI Overviews (formerly SGE), Microsoft Copilot, and emerging AI search platforms. The optimization principles apply universally to AI-powered information retrieval.',
              },
              {
                q: 'Do I need technical knowledge to use the AEO Suite?',
                a: 'No technical knowledge required for basic usage. Our tool provides clear, actionable recommendations in plain language. However, implementing some technical recommendations (like schema markup) may require developer assistance. That\'s why we offer professional implementation services if needed.',
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:border-dark-600 transition-colors group"
              >
                <summary className="text-lg font-semibold text-white cursor-pointer flex items-center justify-between">
                  {faq.q}
                  <span className="text-primary-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-dark-400 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => {
                setGuideModalTab('business');
                setShowGuideModal(true);
              }}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
            >
              View Complete Documentation
            </button>
          </div>

          {/* CTA after FAQ */}
          <div className="mt-12 text-center p-8 bg-gradient-to-r from-primary-500/10 to-blue-500/10 border border-primary-500/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Optimize for AI Search?
            </h3>
            <p className="text-dark-400 mb-6 max-w-2xl mx-auto">
              Start with a free analysis or speak with our AEO experts about professional implementation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
              >
                Try Free Analysis
              </button>
              <button
                  onClick={() => {
                    setPricingModalTab('services');
                    setShowPricingModal(true);
                  }}
                  className="px-8 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg border border-dark-700 transition-colors"
                >
                  View Services
                </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-primary-500" />
                <h3 className="text-white font-bold">AEO Suite <i>by Thatworkx</i></h3>
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
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li>
                  <a 
                    href="#pricing" 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPricingModal(true);
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Pricing
                  </a>
                </li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-white font-bold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-dark-400">
                <li>
                  <a 
                    href="#services"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPricingModal(true);
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Technical Audit
                  </a>
                </li>
                <li>
                  <a 
                    href="#services"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPricingModal(true);
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Content Optimization
                  </a>
                </li>
                <li>
                  <a 
                    href="#services"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPricingModal(true);
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Full Implementation
                  </a>
                </li>
                <li>
                  <a 
                    href="#services"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPricingModal(true);
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Monthly Retainer
                  </a>
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={onUserUpdate}
        prefilledEmail=""
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

export default LandingPage;