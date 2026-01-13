import React, { useState, useEffect } from 'react';
import { Search, Code, FileText, Target, Eye, ExternalLink, CheckCircle2, AlertTriangle, XCircle, Loader2, X, Mail, Phone, Globe, User, Lock, Clock } from 'lucide-react';
import PricingModal, { UpgradeButton } from './components/PricingModal';
import './App.css';

const API_URL = 'http://localhost:3001';

// API Helper
const api = {
  // Check if user has active session
  checkSession: async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/session`, { credentials: 'include' });
      return res.ok ? await res.json() : null;
    } catch (e) {
      return null;
    }
  },

  // Submit lead and get OTP
  submitLead: async (data) => {
    const res = await fetch(`${API_URL}/api/auth/submit-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to submit');
    }
    return res.json();
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Invalid OTP');
    }
    return res.json();
  },

  // Resend OTP
  resendOTP: async (email) => {
    const res = await fetch(`${API_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error('Failed to resend OTP');
    return res.json();
  },

  // Check usage limits
  checkLimits: async () => {
    const res = await fetch(`${API_URL}/api/usage/limits`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to check limits');
    return res.json();
  },

  // Logout
  logout: async () => {
    const res = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return res.ok;
  }
};

// Lead Capture Modal
const LeadCaptureModal = ({ onSubmit, onClose, loading, error }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    phoneNumber: ''
  });
  const [validationError, setValidationError] = useState('');

  const countries = [
    'United Arab Emirates', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'India', 'Singapore', 'Germany', 'France', 'Saudi Arabia', 'Qatar', 'Kuwait',
    'Bahrain', 'Oman', 'Egypt', 'Jordan', 'Lebanon', 'Pakistan', 'Bangladesh',
    'Philippines', 'Indonesia', 'Malaysia', 'Thailand', 'China', 'Japan', 'South Korea'
  ].sort();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.email) {
      setValidationError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    if (!formData.country) {
      setValidationError('Country is required');
      return;
    }

    onSubmit(formData);
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setValidationError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Get Your Free AEO Audit</h2>
            <p className="text-gray-600 mt-1">Enter your details to analyze your website</p>
          </div>
          <button onClick={onClose} className="modal-close" disabled={loading}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <User className="w-4 h-4" />
                First Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className="form-input"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <User className="w-4 h-4" />
                Last Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail className="w-4 h-4" />
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="john@company.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Globe className="w-4 h-4" />
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.country}
              onChange={(e) => updateField('country', e.target.value)}
              className="form-input"
              required
              disabled={loading}
            >
              <option value="">Select your country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Phone className="w-4 h-4" />
              Phone Number <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="tel"
              placeholder="+971 50 123 4567"
              value={formData.phoneNumber}
              onChange={(e) => updateField('phoneNumber', e.target.value)}
              className="form-input"
              disabled={loading}
            />
          </div>

          {(validationError || error) && (
            <div className="error-message">
              <AlertTriangle className="w-5 h-5" />
              <span>{validationError || error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending verification code...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Continue to Verification
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            We'll send a verification code to your email
          </p>
        </form>
      </div>
    </div>
  );
};

// OTP Verification Modal
const OTPModal = ({ email, onVerify, onResend, onBack, loading, error }) => {
  const [otp, setOTP] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      await onResend();
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (e) {
      // Error handled by parent
    }
    setResending(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Enter Verification Code</h2>
            <p className="text-gray-600 mt-1">Check your email: {email}</p>
          </div>
          <button onClick={onBack} className="modal-close" disabled={loading}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="otp-info">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <p className="text-center text-gray-700 mb-4">
              We sent a 6-digit code to your email
            </p>
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="otp-input"
              maxLength="6"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="error-message">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="success-message">
              <CheckCircle2 className="w-5 h-5" />
              <span>Code sent! Check your email</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="submit-button"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Verify & Start Audit
              </>
            )}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-center text-sm text-gray-600 hover:text-gray-800 mt-2 w-full"
          >
            ← Use different email
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================
// UPDATED: Usage Limits Display - Shows "X of Y used"
// ============================================
const UsageLimitsBar = ({ limits, onRefresh, onUpgradeClick }) => {
  if (!limits) return null;

  const tools = [
    { id: 'technical', name: 'Technical', icon: Code },
    { id: 'content', name: 'Content', icon: FileText },
    { id: 'query-match', name: 'Query', icon: Target },
    { id: 'visibility', name: 'Visibility', icon: Eye }
  ];

  const hasSubscription = limits.subscription?.type !== 'free';

  return (
    <div className="usage-limits-bar">
      <div className="usage-header">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Today's Usage {hasSubscription && <span className="text-green-600">(Unlimited)</span>}
        </h3>
        <button onClick={onRefresh} className="text-xs text-blue-600 hover:text-blue-800">
          Refresh
        </button>
      </div>
      <div className="usage-grid">
        {tools.map(tool => {
          const limit = limits.limits[tool.id];
          const Icon = tool.icon;
          const statusColor = limit.canUse ? 'text-green-600' : 'text-red-600';
          
          return (
            <div key={tool.id} className="usage-item">
              <Icon className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-700">{tool.name}</span>
              <span className={`text-xs font-semibold ${statusColor}`}>
                {hasSubscription ? 'Unlimited' : `${limit.used} of ${limit.limit} used`}
              </span>
            </div>
          );
        })}
      </div>
      {!hasSubscription && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Resets daily at 12 AM Dubai time • <UpgradeButton variant="link" onClick={onUpgradeClick} />
        </p>
      )}
    </div>
  );
};


// Session Info Bar
const SessionInfo = ({ session, onLogout }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-5 h-5 text-blue-600" />
      <span className="text-sm text-blue-900">
        Logged in as <strong>{session.user?.email || session.email}</strong>
      </span>
    </div>
    <button
      onClick={onLogout}
      className="text-sm text-blue-600 hover:text-blue-800 underline"
    >
      Logout
    </button>
  </div>
);

// Utility Components
const StatusIcon = ({ value, threshold = 70 }) => {
  const score = typeof value === 'number' ? value : 0;
  if (score >= threshold) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  if (score >= 50) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  return <XCircle className="w-5 h-5 text-red-600" />;
};

const ScoreCircle = ({ score, size = 'large' }) => {
  const getColor = () => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const sizeClasses = size === 'large' ? 'w-32 h-32 text-4xl' : 'w-20 h-20 text-2xl';

  return (
    <div className={`${sizeClasses} rounded-full flex items-center justify-center font-bold`}
         style={{ backgroundColor: `${getColor()}20`, color: getColor(), border: `4px solid ${getColor()}` }}>
      {score}
    </div>
  );
};

const Section = ({ title, icon: Icon, children, score }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-blue-600" />}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {score !== undefined && <ScoreCircle score={score} size="small" />}
    </div>
    {children}
  </div>
);

const MetricRow = ({ label, value, good }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-700">{label}</span>
    <div className="flex items-center gap-2">
      {typeof value === 'boolean' ? (
        value ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />
      ) : (
        <>
          {good !== undefined && <StatusIcon value={good ? 100 : 0} />}
          <span className={`font-semibold ${good ? 'text-green-600' : ''}`}>{value}</span>
        </>
      )}
    </div>
  </div>
);

const RecommendationsList = ({ recommendations }) => (
  <div className="space-y-3">
    {recommendations.slice(0, 10).map((rec, idx) => (
      <div key={idx} className="border-l-4 pl-4 py-2"
           style={{ borderColor: rec.priority === 'critical' ? '#ef4444' : rec.priority === 'high' ? '#f59e0b' : rec.priority === 'medium' ? '#3b82f6' : '#6b7280' }}>
        <div className="flex items-start gap-2">
          <span className="text-xs font-semibold px-2 py-1 rounded uppercase"
                style={{ 
                  backgroundColor: rec.priority === 'critical' ? '#fee2e2' : rec.priority === 'high' ? '#fef3c7' : rec.priority === 'medium' ? '#dbeafe' : '#f3f4f6',
                  color: rec.priority === 'critical' ? '#991b1b' : rec.priority === 'high' ? '#92400e' : rec.priority === 'medium' ? '#1e40af' : '#374151'
                }}>
            {rec.priority}
          </span>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{rec.issue || rec.action}</p>
            <p className="text-sm text-gray-600 mt-1">{rec.action || rec.implementation}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ============================================
// UPDATED: URL Input with Page Clarification
// ============================================
const UrlInput = ({ url, setUrl, onAnalyze, loading }) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Enter Page URL to Analyze
      <span className="text-gray-500 font-normal ml-2">
        (Analyzes this specific page only, not the entire website)
      </span>
    </label>
    <div className="flex gap-3">
      <input
        type="text"
        placeholder="https://example.com/specific-page"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !loading && url && onAnalyze()}
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
      <button
        onClick={onAnalyze}
        disabled={loading || !url}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Analyze Page
          </>
        )}
      </button>
    </div>
    <p className="text-xs text-gray-500 mt-2">
      💡 Tip: Analyze your most important pages individually (homepage, service pages, blog posts, etc.)
    </p>
  </div>
);

// ============================================
// UPDATED: Results Header - Clarifies Single Page
// ============================================
// Add this as the first child inside each tool's results section:

const ResultsHeader = ({ url, toolName }) => (
  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <AlertTriangle className="w-5 h-5 text-blue-600" />
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-blue-800">
          Single Page Analysis
        </h3>
        <p className="text-sm text-blue-700 mt-1">
          This analysis is for <strong className="font-semibold">{url}</strong> only. 
          For comprehensive website optimization, analyze your key pages separately.
        </p>
      </div>
    </div>
  </div>
);

const ErrorDisplay = ({ error }) => error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    {typeof error === 'string' ? (
      <div className="flex items-center gap-2 text-red-800">
        <AlertTriangle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    ) : (
      <div className="text-red-800">{error}</div>
    )}
  </div>
);

// Tool Component Factory
const createToolComponent = (toolId, toolName, toolDescription, endpoint) => {
  return function ToolComponent() {
    const [url, setUrl] = useState('');
    const [queries, setQueries] = useState(toolId === 'query-match' ? ['', '', ''] : null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [pendingEmail, setPendingEmail] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    
    const [session, setSession] = useState(null);
    const [limits, setLimits] = useState(null);
    const [showPricingModal, setShowPricingModal] = useState(false);

    useEffect(() => {
      checkAuth();
    }, []);

    const checkAuth = async () => {
      const sess = await api.checkSession();
      setSession(sess);
      if (sess) {
        await loadLimits();
      }
    };

    const loadLimits = async () => {
      try {
        const data = await api.checkLimits();
        setLimits(data);
      } catch (e) {
        console.error('Failed to load limits:', e);
      }
    };

    const handleAnalyze = async () => {
      if (!session) {
        setShowLeadModal(true);
        return;
      }

      // Check usage limit
      if (limits && !limits.limits[toolId]?.canUse) {
        setError(`Daily limit reached for this tool. Resets at ${limits.limits[toolId].resetAt || '12 AM Dubai time'}`);
        return;
      }

      await analyze();
    };

    const handleLeadSubmit = async (data) => {
      setAuthLoading(true);
      setAuthError('');
      try {
        await api.submitLead(data);
        setPendingEmail(data.email);
        setShowLeadModal(false);
        setShowOTPModal(true);
      } catch (e) {
        setAuthError(e.message);
      }
      setAuthLoading(false);
    };

    const handleOTPVerify = async (otp) => {
      setAuthLoading(true);
      setAuthError('');
      try {
        await api.verifyOTP(pendingEmail, otp);
        setShowOTPModal(false);
        await checkAuth();
        await analyze();
      } catch (e) {
        setAuthError(e.message);
      }
      setAuthLoading(false);
    };

    const handleOTPResend = async () => {
      await api.resendOTP(pendingEmail);
    };

    const handleLogout = async () => {
      await api.logout();
      setSession(null);
      setLimits(null);
      setResults(null);
    };

    const analyze = async () => {
      setLoading(true);
      setError(null);
      try {
        const body = toolId === 'query-match' 
          ? { url, queries: queries.filter(q => q.trim()) }
          : { url };

        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });

        const data = await res.json();
        
        if (!res.ok) {
          if (res.status === 429) {
            setError(
              <div className="space-y-3">
                <p className="font-semibold">{data.message || 'Daily limit reached'}</p>
                <p className="text-sm text-gray-600">You've used all your free analyses for this tool today.</p>
                <UpgradeButton 
                  variant="primary" 
                  onClick={() => setShowPricingModal(true)}
                />
              </div>
            );
          } else {
            throw new Error(data.message || data.error);
          }
        } else {
          setResults(data);
          await loadLimits(); // Refresh limits after analysis
        }
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    };

    const updateQuery = (idx, val) => {
      if (queries) {
        setQueries(queries.map((q, i) => i === idx ? val : q));
      }
    };

    const addQuery = () => {
      if (queries) {
        setQueries([...queries, '']);
      }
    };

    return (
      <div>
        {showLeadModal && (
          <LeadCaptureModal
            onSubmit={handleLeadSubmit}
            onClose={() => { setShowLeadModal(false); setAuthError(''); }}
            loading={authLoading}
            error={authError}
          />
        )}

        {showOTPModal && (
          <OTPModal
            email={pendingEmail}
            onVerify={handleOTPVerify}
            onResend={handleOTPResend}
            onBack={() => { setShowOTPModal(false); setShowLeadModal(true); setAuthError(''); }}
            loading={authLoading}
            error={authError}
          />
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{toolName}</h2>
          <p className="text-gray-600">{toolDescription}</p>
        </div>

        {session && <SessionInfo session={session} onLogout={handleLogout} />}
        {session && limits && <UsageLimitsBar limits={limits} onRefresh={loadLimits} onUpgradeClick={() => setShowPricingModal(true)} />}

        <UrlInput url={url} setUrl={setUrl} onAnalyze={handleAnalyze} loading={loading} />

        {toolId === 'query-match' && queries && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <h3 className="font-semibold mb-3">Target Queries (What you want to rank for)</h3>
            <div className="space-y-2">
              {queries.map((q, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`e.g., "What is ${i === 0 ? 'your product' : 'query ' + (i + 1)}?"`}
                  value={q}
                  onChange={(e) => updateQuery(i, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              ))}
              <button onClick={addQuery} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                + Add another query
              </button>
            </div>
          </div>
        )}

        <ErrorDisplay error={error} />

        {results && (
          <div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{toolName} Score</h3>
                  <a href={results.url} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline flex items-center gap-1 text-sm mt-1">
                   APP {results.url} <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <ScoreCircle score={results.overallScore} />
              </div>
            </div>

            {/* Tool-specific results rendering would go here */}
            {/* For brevity, I'll add a generic recommendations section */}
            
            {results.recommendations && (
              <Section title={`Recommendations (${results.recommendations.length})`} icon={AlertTriangle}>
                <RecommendationsList recommendations={results.recommendations} />
              </Section>
            )}
          </div>
        )}

        <PricingModal 
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          currentPlan={session?.subscription?.type || 'free'}
        />
      </div>
    );
  };
};

// Create all 4 tools
const TechnicalAudit = createToolComponent('technical', 'Technical AEO Audit', 'Analyze whether AI engines can properly access and parse your website', '/api/technical');
const ContentAnalyzer = createToolComponent('content', 'Content Quality Analyzer', 'Analyze whether your content is optimized for AI extraction and citation', '/api/content');
const QueryMatchAnalyzer = createToolComponent('query-match', 'Query Match Analyzer', 'See how well your content matches specific queries users might ask AI engines', '/api/query-match');
const VisibilityChecker = createToolComponent('visibility', 'AI Visibility Checker', 'Overall likelihood of being cited by AI engines', '/api/visibility');

// MAIN APP
export default function App() {
  const [activeTab, setActiveTab] = useState('technical');
  const [showPricingModal, setShowPricingModal] = useState(false);

  const tabs = [
    { id: 'technical', name: 'Technical Audit', icon: Code, description: 'Schema, crawlability, structure' },
    { id: 'content', name: 'Content Quality', icon: FileText, description: 'Readability, Q&A, citations' },
    { id: 'query', name: 'Query Match', icon: Target, description: 'Match content to prompts' },
    { id: 'visibility', name: 'AI Visibility', icon: Eye, description: 'Overall citation potential' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">AEO Audit Suite</h1>
          <p className="text-gray-600 mt-1">Answer Engine Optimization Tools</p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">{tab.name}</div>
                  <div className="text-xs opacity-70">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'technical' && <TechnicalAudit />}
        {activeTab === 'content' && <ContentAnalyzer />}
        {activeTab === 'query' && <QueryMatchAnalyzer />}
        {activeTab === 'visibility' && <VisibilityChecker />}
      </div>

      <div className="text-center py-8 text-gray-500 text-sm border-t border-gray-200 bg-white mt-12">
        <p>AEO Audit Suite — Optimize for AI-powered search</p>
        <p className="text-xs mt-1">Powered by Thatworkx Solutions</p>
      </div>

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentPlan='free'
      />
    </div>
  );
}