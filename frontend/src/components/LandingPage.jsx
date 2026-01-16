import React, { useState, useRef } from 'react';
import { 
  Code, FileText, Target, Eye, Search, Home, 
  Sparkles, Check, X, ExternalLink, Mail, ArrowRight
} from 'lucide-react';

/**
 * Stat Card Component with Citation
 */
const StatCard = ({ value, label, citation, citationUrl }) => (
  <div className="text-center">
    <div className="text-3xl font-bold text-cyan-500">{value}</div>
    <div className="text-sm text-gray-600 mt-1">{label}</div>
    <a 
      href={citationUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-xs text-gray-400 hover:text-cyan-600 mt-1 inline-flex items-center gap-1"
    >
      {citation} <ExternalLink className="w-3 h-3" />
    </a>
  </div>
);

/**
 * Compact Tool Card for dark section
 */
const CompactToolCard = ({ icon: Icon, title, subtitle, color }) => (
  <div className="bg-white/10 backdrop-blur rounded-lg p-4 hover:bg-white/15 transition-colors">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <h4 className="text-white font-semibold text-sm mb-1">{title}</h4>
    <p className="text-gray-300 text-xs leading-relaxed">{subtitle}</p>
    <div className="mt-3 pt-3 border-t border-white/10">
      <span className="text-xs text-cyan-400">Free: 3/day</span>
    </div>
  </div>
);

/**
 * Comparison Table Component (Dark themed)
 */
const ComparisonTable = ({ onFairUseClick }) => {
  const features = [
    { name: 'Daily audits per tool', free: '3', pro: 'Unlimited*' },
    { name: 'Technical Audit', free: true, pro: true },
    { name: 'Content Quality Analysis', free: true, pro: true },
    { name: 'Query Match Analysis', free: true, pro: true },
    { name: 'AI Visibility Score', free: true, pro: true },
    { name: 'Historical comparisons', free: false, pro: true },
    { name: 'Export reports (PDF)', free: false, pro: true },
    { name: 'Priority support', free: false, pro: true },
    { name: 'API access', free: false, pro: true },
  ];

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-gray-900">
              <th className="text-left py-4 px-5 text-sm font-semibold text-gray-300">Feature</th>
              <th className="text-center py-4 px-4">
                <div className="text-sm font-semibold text-gray-300">Free</div>
                <div className="text-xs text-gray-500">$0/month</div>
              </th>
              <th className="text-center py-4 px-4 bg-cyan-600">
                <div className="text-sm font-semibold text-white">Pro Monthly</div>
                <div className="text-xs text-cyan-100">$20/month</div>
              </th>
              <th className="text-center py-4 px-4 bg-cyan-700">
                <div className="text-sm font-semibold text-white">Pro 6-Month</div>
                <div className="text-xs text-cyan-100">$18/mo</div>
                <div className="text-xs text-cyan-300">(Save 10%)</div>
              </th>
              <th className="text-center py-4 px-4 bg-cyan-800">
                <div className="text-sm font-semibold text-white">Pro Annual</div>
                <div className="text-xs text-cyan-100">$15/mo</div>
                <div className="text-xs text-cyan-300">(Save 25%)</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {features.map((feature, idx) => (
              <tr key={idx} className="hover:bg-gray-750">
                <td className="py-3 px-5 text-sm text-gray-300">
                  {feature.name}
                  {feature.pro === 'Unlimited*' && (
                    <button 
                      onClick={onFairUseClick}
                      className="ml-1 text-cyan-400 hover:text-cyan-300 text-xs"
                      title="View Fair Use Policy"
                    >
                      *
                    </button>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {typeof feature.free === 'boolean' ? (
                    feature.free ? (
                      <Check className="w-5 h-5 text-green-400 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-600 mx-auto" />
                    )
                  ) : (
                    <span className="text-sm text-gray-400">{feature.free}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center bg-cyan-600/10">
                  {typeof feature.pro === 'boolean' ? (
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  ) : (
                    <span className="text-sm text-cyan-400">{feature.pro}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center bg-cyan-700/10">
                  {typeof feature.pro === 'boolean' ? (
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  ) : (
                    <span className="text-sm text-cyan-400">{feature.pro}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center bg-cyan-800/10">
                  {typeof feature.pro === 'boolean' ? (
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  ) : (
                    <span className="text-sm text-cyan-400">{feature.pro}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Main Landing Page Component
 */
const LandingPage = ({ 
  onStartAudit, 
  onLogin,
  onLogout,
  session,
  onUpgradeClick, 
  onProfessionalClick, 
  onFairUseClick, 
  onContactClick,
  isAuthenticated = false 
}) => {
  const [url, setUrl] = useState('');
  const urlInputRef = useRef(null);

  const handleAnalyze = () => {
    if (url.trim()) {
      onStartAudit(url);
    }
  };

  const handleGetStarted = () => {
    urlInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => urlInputRef.current?.focus(), 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && url.trim()) {
      handleAnalyze();
    }
  };

  const tools = [
    {
      icon: Code,
      title: 'Technical Audit',
      subtitle: 'Schema markup, crawlability, HTML structure, AI accessibility',
      color: 'bg-red-500 text-white'
    },
    {
      icon: FileText,
      title: 'Content Quality',
      subtitle: 'Readability, Q&A patterns, citation-worthiness, factual density',
      color: 'bg-orange-500 text-white'
    },
    {
      icon: Target,
      title: 'Query Match',
      subtitle: 'Target query optimization, semantic relevance, answer positioning',
      color: 'bg-amber-500 text-white'
    },
    {
      icon: Eye,
      title: 'AI Visibility',
      subtitle: 'Citation potential, authority signals, competitive positioning',
      color: 'bg-pink-500 text-white'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Constrained wrapper - max 1100px */}
      <div className="max-w-[1100px] mx-auto bg-white shadow-xl">
        
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Home className="w-6 h-6 text-gray-600" />
              <div>
                <h1 className="text-xl font-bold">
                    <img src="/AEO-thatworkx-logo-w.svg" alt="AEO@Thatworkx logo" className="h-24 w-auto" />
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {session ? (
                <>
                  <span className="text-sm text-gray-600 hidden sm:block">{session.email}</span>
                  <button 
                    onClick={onLogout}
                    className="text-sm text-cyan-600 hover:text-cyan-700 underline"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button 
                  onClick={onLogin}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Login
                </button>
              )}
              <button 
                onClick={onUpgradeClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Upgrade
              </button>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-6 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium uppercase tracking-wider">
                Answer Engine Optimization
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Optimize Your Website for
              <span className="text-cyan-400"> AI-Powered Search</span>
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Get your content cited by ChatGPT, Perplexity, Google AI Overviews, and other 
              AI search engines. Analyze, optimize, and track your Answer Engine visibility.
            </p>
            
            {/* URL Input */}
            <div 
              ref={urlInputRef}
              className="bg-white rounded-xl p-2 flex items-center gap-2 max-w-2xl mx-auto shadow-lg"
            >
              <input
                type="url"
                placeholder="Enter your webpage URL (e.g., https://example.com/page)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-3 text-gray-900 text-sm rounded-lg focus:outline-none"
              />
              <button
                onClick={handleAnalyze}
                disabled={!url.trim()}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
              >
                <Search className="w-5 h-5" />
                Analyze
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Free analysis • No credit card required • 3 audits per day
            </p>
          </div>
        </section>

        {/* WHY AEO MATTERS - with REAL STATS and CITATIONS */}
        <section className="px-6 py-12 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Why Answer Engine Optimization Matters
            </h3>
            <p className="text-gray-600 mb-8">
              Traditional SEO focuses on ranking in search results. AEO focuses on getting your 
              content <strong>cited directly</strong> in AI-generated answers. As more users turn to 
              ChatGPT, Perplexity, and Google AI Overviews for answers, being the cited source 
              becomes the new competitive advantage.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard 
                value="357%"
                label="increase in AI referral traffic (Jun 2024 → Jun 2025)"
                citation="Exposure Ninja"
                citationUrl="https://exposureninja.com/blog/ai-search-statistics/"
              />
              <StatCard 
                value="5x"
                label="higher conversion rate from AI traffic vs Google (14.2% vs 2.8%)"
                citation="Exposure Ninja"
                citationUrl="https://exposureninja.com/blog/ai-search-statistics/"
              />
              <StatCard 
                value="1.5B"
                label="monthly users now see Google AI Overviews"
                citation="Omnius"
                citationUrl="https://www.omnius.so/blog/ai-search-industry-report"
              />
            </div>
          </div>
        </section>

        {/* THE 4 TOOLS - Dark section with compact horizontal cards */}
        <section className="px-6 py-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">
              Four Powerful Audit Tools
            </h3>
            <p className="text-gray-400">
              Comprehensive analysis across technical, content, query matching, and visibility dimensions.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tools.map((tool, idx) => (
              <CompactToolCard key={idx} {...tool} />
            ))}
          </div>
        </section>

        {/* FREE vs PAID COMPARISON - Dark section */}
        <section className="px-6 py-12 bg-gray-900">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">
              Choose Your Plan
            </h3>
            <p className="text-gray-400">
              Start free and upgrade when you need more power.
            </p>
          </div>
          <ComparisonTable onFairUseClick={onFairUseClick} />
          <div className="text-center mt-8">
            <button 
              onClick={onUpgradeClick}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
            >
              Upgrade to Pro
            </button>
            <div className="mt-3">
              <button 
                onClick={onFairUseClick}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline"
              >
                * View Fair Use Policy
              </button>
            </div>
          </div>
        </section>

        {/* PROFESSIONAL SERVICES - Light section for contrast */}
        <section className="px-6 py-12 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Need Hands-On Help?
                </h3>
                <p className="text-gray-600 mb-6">
                  Our AEO experts can audit your entire site, implement optimizations, and develop 
                  a comprehensive strategy to maximize your AI search visibility.
                </p>
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Complete AEO Audit</h4>
                      <span className="text-lg font-bold text-cyan-600">$2,000</span>
                    </div>
                    <p className="text-sm text-gray-600">Up to 15 pages • 2-week delivery • Implementation guide</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Ongoing Maintenance</h4>
                      <span className="text-lg font-bold text-cyan-600">$150/mo</span>
                    </div>
                    <p className="text-sm text-gray-600">Monthly audits • Priority support • Performance tracking</p>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-gray-900 rounded-xl p-6 text-center">
                  <div className="text-sm text-gray-400 mb-2">Custom Projects</div>
                  <div className="text-2xl font-bold text-white mb-1">Let's Talk</div>
                  <div className="text-sm text-gray-500 mb-4">Enterprise & Agency</div>
                  <button 
                    onClick={onProfessionalClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Contact Us <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-gray-900 text-white px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold mb-1">
                <img src="/AEO-thatworkx-logo.svg" alt="AEO@Thatworkx logo" className="h-16 w-auto" />
              </h1>
              <p className="text-xs text-gray-400">
                AEO Audit Suite — Optimize for AI-powered search
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
              <button 
                onClick={onFairUseClick}
                className="hover:text-white"
              >
                Fair Use Policy
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <a href="mailto:info@thatworkx.com" className="flex items-center gap-1 hover:text-white">
                <Mail className="w-5 h-5" /> info@thatworkx.com
              </a>
            </div>
          </div>
          <div className="text-center text-xs text-gray-500 mt-6 pt-6 border-t border-gray-800">
            © 2025 Thatworkx Solutions. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;