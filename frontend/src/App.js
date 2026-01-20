import React, { useState, useEffect } from 'react';

// Import components
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { LeadCaptureModal, LoginModal, OTPModal } from './components/LeadCaptureModal';
import PricingModal from './components/PricingModal';
import FairUsePolicyModal from './components/FairUsePolicyModal';
import ContactModal from './components/ContactModal';
import StatsBanner from './components/StatsBanner';
import UpgradeInterestModal from './components/UpgradeInterestModal';
import ProfessionalServicesModal from './components/ProfessionalServicesModal';

import './App.css';
import { API_URL } from './config/api';

console.log('[App] Environment:', process.env.NODE_ENV);
console.log('[App] API_URL:', API_URL || '(using proxy)');

// ===========================================
// API HELPER FUNCTIONS
// ===========================================
const api = {
  checkSession: async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/session`, { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.authenticated && data.user) {
        return {
          ...data,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  },
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
  // Login-only endpoint (for existing users)
  loginUser: async (email) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'User not found. Please register first.');
    }
    return data;
  },
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
    const data = await res.json();
    // Normalize the response - flatten user data for easy access
    if (data.success && data.user) {
      return {
        ...data,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
      };
    }
    return data;
  },
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
  checkLimits: async () => {
    const res = await fetch(`${API_URL}/api/usage/limits`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to check limits');
    return res.json();
  },
  logout: async () => {
    const res = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return res.ok;
  },
  analyze: async (tool, url, queries = []) => {
    const toolEndpoints = {
      technical: '/api/technical',
      content: '/api/content',
      query: '/api/query-match',
      visibility: '/api/visibility'
    };

    const body = tool === 'query' 
      ? { url, queries: queries.filter(q => q.trim()) }
      : { url };

    const res = await fetch(`${API_URL}${toolEndpoints[tool]}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });

    const data = await res.json();
    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('SESSION_EXPIRED');
      }
      if (res.status === 429) {
        throw new Error('LIMIT_REACHED');
      }
      throw new Error(data.message || data.error || 'Analysis failed');
    }
    
    return data;
  }
};

// ===========================================
// MAIN APP COMPONENT
// ===========================================
export default function App() {
  // View State
  const [showLanding, setShowLanding] = useState(true);
  
  // Session & Auth
  const [session, setSession] = useState(null);
  const [limits, setLimits] = useState(null);
  
  // Modal States
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showFairUseModal, setShowFairUseModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [pricingModalTab, setPricingModalTab] = useState('self-service');
  
  // Auth Flow State
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingUrl, setPendingUrl] = useState('');
  const [autoAnalyzeAfterAuth, setAutoAnalyzeAfterAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Tool State
  const [activeTool, setActiveTool] = useState('technical');
  const [url, setUrl] = useState('');
  const [queries, setQueries] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // CHANGED: Results stored per tool (each tool remembers its last result)
  const [toolResults, setToolResults] = useState({
    technical: null,
    content: null,
    query: null,
    visibility: null
  });
  
  // URL Tabs State
  const [urlTabs, setUrlTabs] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  //Upgrade Modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  
  // ===========================================
  // EFFECTS
  // ===========================================
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===========================================
  // AUTH HANDLERS
  // ===========================================
  const checkAuth = async () => {
    const s = await api.checkSession();
    if (s) {
      setSession(s);
      loadLimits();
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

  const handleStartAudit = (landingUrl) => {
    if (!session) {
      setPendingUrl(landingUrl);
      setUrl(landingUrl);
      setAutoAnalyzeAfterAuth(true);
      setShowLeadModal(true);  // Show registration modal for new users
    } else {
      setUrl(landingUrl);
      setShowLanding(false);
      setTimeout(() => handleAnalyze(landingUrl), 100);
    }
  };

  // Open login modal (existing users)
  const handleLoginClick = () => {
    setPendingUrl('');
    setAutoAnalyzeAfterAuth(false);
    setAuthError('');
    setShowLoginModal(true);
  };

  // Switch from registration to login modal
  const handleSwitchToLogin = () => {
    setShowLeadModal(false);
    setAuthError('');
    setShowLoginModal(true);
  };

  // Switch from login to registration modal
  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setAuthError('');
    setShowLeadModal(true);
  };

  // Handle registration form submission
  const handleLeadSubmit = async (formData) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await api.submitLead(formData);
      setPendingEmail(formData.email);
      setShowLeadModal(false);
      setShowOTPModal(true);
    } catch (e) {
      setAuthError(e.message);
    }
    setAuthLoading(false);
  };

  // Handle login form submission (email only)
  const handleLoginSubmit = async (formData) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      // Try to login - this will send OTP to existing user
      await api.loginUser(formData.email);
      setPendingEmail(formData.email);
      setShowLoginModal(false);
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
      const data = await api.verifyOTP(pendingEmail, otp);
      setSession(data);
      setShowOTPModal(false);
      await loadLimits();
      setShowLanding(false);
      
      if (autoAnalyzeAfterAuth && pendingUrl) {
        setUrl(pendingUrl);
        // Pass skipAuthCheck=true to bypass the session check since we just authenticated
        setTimeout(() => handleAnalyze(pendingUrl, true), 300);
      }
      
      setAutoAnalyzeAfterAuth(false);
      setPendingUrl('');
    } catch (e) {
      setAuthError(e.message);
    }
    setAuthLoading(false);
  };

  const handleOTPResend = async () => {
    try {
      await api.resendOTP(pendingEmail);
      setAuthError('');
    } catch (e) {
      setAuthError(e.message);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setSession(null);
    setLimits(null);
    // Clear all tool results on logout
    setToolResults({
      technical: null,
      content: null,
      query: null,
      visibility: null
    });
    setShowLanding(true);
  };

  // ===========================================
  // ANALYSIS HANDLER - UPDATED
  // ===========================================
  const handleAnalyze = async (urlOverride = null, skipAuthCheck = false) => {
    const targetUrl = urlOverride || url;
    
    if (!targetUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Check limits before proceeding
    if (session && limits) {
      const toolKey = activeTool === 'query' ? 'query-match' : activeTool;
      const toolLimit = limits.limits?.[toolKey];
      if (toolLimit && toolLimit.remaining <= 0) {
        // Show upgrade modal when limit reached
        setShowUpgradeModal(true);
        return;
      }
    }

    if (!session && !skipAuthCheck) {
      setPendingUrl(targetUrl);
      setAutoAnalyzeAfterAuth(true);
      setShowLeadModal(true);  // Show registration modal
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.analyze(activeTool, targetUrl, queries);
      
      // CHANGED: Store result for the current tool
      setToolResults(prev => ({
        ...prev,
        [activeTool]: result
      }));
      
      await loadLimits();

      // Update tabs
      const existingTabIndex = urlTabs.findIndex(t => t.url === targetUrl && t.tool === activeTool);
      if (existingTabIndex >= 0) {
        const newTabs = [...urlTabs];
        newTabs[existingTabIndex] = { url: targetUrl, tool: activeTool, results: result };
        setUrlTabs(newTabs);
        setActiveTabIndex(existingTabIndex);
      } else {
        const newTab = { url: targetUrl, tool: activeTool, results: result };
        setUrlTabs([...urlTabs, newTab]);
        setActiveTabIndex(urlTabs.length);
      }

    } catch (e) {
      console.error('Analysis error:', e);
      
      // Handle session expiration
      if (e.message === 'SESSION_EXPIRED') {
        setSession(null);
        setError('Your session has expired. Please log in again.');
        setPendingUrl(targetUrl);
        setAutoAnalyzeAfterAuth(true);
        setShowLoginModal(true);
        setLoading(false);
        return;
      }

      // Handle limit reached
      if (e.message === 'LIMIT_REACHED') {
        setShowUpgradeModal(true);
        setLoading(false);
        return;
      }
      
      let errorMessage = 'Analysis failed. Please try again.';
      
      if (e.message.includes('ENOTFOUND') || e.message.includes('find this website')) {
        errorMessage = 'Unable to reach this website. Please check the URL is correct and includes the full domain.';
      } else if (e.message.includes('timeout') || e.message.includes('ETIMEDOUT')) {
        errorMessage = 'The website took too long to respond. Please try again or use a different URL.';
      } else if (e.message.includes('404') || e.message.includes('not found')) {
        errorMessage = 'Website not found. Please check the URL and try again.';
      } else if (e.message.includes('limit')) {
        errorMessage = 'Daily limit reached. Please upgrade for unlimited analyses.';
        setShowUpgradeModal(true);
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
    }
    setLoading(false);
  };

  // ===========================================
  // TOOL CHANGE HANDLER - NEW
  // ===========================================
  const handleToolChange = (newTool) => {
    setActiveTool(newTool);
    setError(null); // Clear any errors when switching tools
    // Results will automatically update via toolResults[activeTool]
  };

  const handleTabClick = (idx) => {
    setActiveTabIndex(idx);
    const tab = urlTabs[idx];
    if (tab) {
      setUrl(tab.url);
      setActiveTool(tab.tool);
      setToolResults(prev => ({
        ...prev,
        [tab.tool]: tab.results
      }));
    }
  };

  const handleTabClose = (idx) => {
    const newTabs = urlTabs.filter((_, i) => i !== idx);
    setUrlTabs(newTabs);
    if (idx === activeTabIndex && newTabs.length > 0) {
      const newIdx = Math.max(0, idx - 1);
      setActiveTabIndex(newIdx);
      const tab = newTabs[newIdx];
      if (tab) {
        setUrl(tab.url);
        setActiveTool(tab.tool);
        setToolResults(prev => ({
          ...prev,
          [tab.tool]: tab.results
        }));
      }
    } else if (newTabs.length === 0) {
      setUrl('');
      setToolResults({
        technical: null,
        content: null,
        query: null,
        visibility: null
      });
    }
  };

  const handleNewTab = () => {
    setUrl('');
    setToolResults({
      technical: null,
      content: null,
      query: null,
      visibility: null
    });
    setActiveTabIndex(-1);
  };

  // ===========================================
  // MODAL HELPERS
  // ===========================================
  const closeLeadModal = () => {
    setShowLeadModal(false);
    setAuthError('');
    setAutoAnalyzeAfterAuth(false);
    setPendingUrl('');
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setAuthError('');
  };

  const closeOTPModal = () => {
    setShowOTPModal(false);
    // Go back to the previous modal based on context
    setShowLeadModal(true);
    setAuthError('');
  };

  const openFairUseFromPricing = () => {
    setShowPricingModal(false);
    setShowFairUseModal(true);
  };

    // Helper functions to open pricing modal with specific tab
  const openPricingModalSelfService = () => {
    setPricingModalTab('self-service');
    setShowPricingModal(true);
  };

  const openPricingModalProfessional = () => {
    setPricingModalTab('professional');
    setShowPricingModal(true);
  };

  // ===========================================
  // RENDER: LANDING PAGE
  // ===========================================
  if (showLanding) {
    return (
      <>
        {/* Stats Banner */}
        <StatsBanner />
        <LandingPage 
          onStartAudit={handleStartAudit}
          onLogin={handleLoginClick}
          onLogout={handleLogout}
          session={session}
          onUpgradeClick={openPricingModalSelfService}
          onProfessionalClick={openPricingModalProfessional}
          onFairUseClick={() => setShowFairUseModal(true)}
          onContactClick={() => setShowContactModal(true)}
          isAuthenticated={!!session}
        />
        
        {/* Registration Modal */}
        {showLeadModal && (
          <LeadCaptureModal
            onSubmit={handleLeadSubmit}
            onClose={closeLeadModal}
            onSwitchToLogin={handleSwitchToLogin}
            loading={authLoading}
            error={authError}
            url={pendingUrl}
          />
        )}

        {/* Login Modal */}
        {showLoginModal && (
          <LoginModal
            onSubmit={handleLoginSubmit}
            onClose={closeLoginModal}
            onSwitchToRegister={handleSwitchToRegister}
            loading={authLoading}
            error={authError}
          />
        )}
        
        {/* OTP Modal */}
        {showOTPModal && (
          <OTPModal
            email={pendingEmail}
            onVerify={handleOTPVerify}
            onResend={handleOTPResend}
            onBack={closeOTPModal}
            loading={authLoading}
            error={authError}
          />
        )}
        
        {/* Other Modals */}
        <PricingModal 
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          onFairUseClick={openFairUseFromPricing}
          initialTab={pricingModalTab}
          onOpenUpgradeModal={() => {
            setShowPricingModal(false);
            setShowUpgradeModal(true);
          }}
          onOpenProfessionalModal={() => {
            setShowPricingModal(false);
            setShowProfessionalModal(true);
          }}
        />
        
        <FairUsePolicyModal 
          isOpen={showFairUseModal}
          onClose={() => setShowFairUseModal(false)}
        />
        
        <ContactModal 
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
        />

        <UpgradeInterestModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
        
        <ProfessionalServicesModal 
          isOpen={showProfessionalModal}
          onClose={() => setShowProfessionalModal(false)}
        />
      </>
    );
  }

  // ===========================================
  // RENDER: DASHBOARD
  // ===========================================
  return (
    <>
      {/* Stats Banner */}
      <StatsBanner />
      
      <Dashboard
        // Session & Auth
        session={session}
        onLogout={handleLogout}
        onLogin={handleLoginClick}
        
        // Navigation
        onGoHome={() => setShowLanding(true)}
        
        // Tool State
        activeTool={activeTool}
        setActiveTool={handleToolChange}  // CHANGED: Use new handler
        
        // URL & Analysis
        url={url}
        setUrl={setUrl}
        queries={queries}
        setQueries={setQueries}
        loading={loading}
        error={error}
        results={toolResults[activeTool]}  // CHANGED: Pass current tool's results
        onAnalyze={() => handleAnalyze()}
        
        // Tabs
        urlTabs={urlTabs}
        activeTabIndex={activeTabIndex}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onNewTab={handleNewTab}
        
        // Usage
        limits={limits?.limits}
        
        // Modals
        onUpgradeClick={openPricingModalSelfService}
        onProfessionalClick={openPricingModalProfessional}
        onContactClick={() => setShowContactModal(true)}
      />

      {/* Registration Modal */}
      {showLeadModal && (
        <LeadCaptureModal
          onSubmit={handleLeadSubmit}
          onClose={closeLeadModal}
          onSwitchToLogin={handleSwitchToLogin}
          loading={authLoading}
          error={authError}
          url={pendingUrl}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onSubmit={handleLoginSubmit}
          onClose={closeLoginModal}
          onSwitchToRegister={handleSwitchToRegister}
          loading={authLoading}
          error={authError}
        />
      )}
      
      {/* OTP Modal */}
      {showOTPModal && (
        <OTPModal
          email={pendingEmail}
          onVerify={handleOTPVerify}
          onResend={handleOTPResend}
          onBack={closeOTPModal}
          loading={authLoading}
          error={authError}
        />
      )}

      <PricingModal 
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onFairUseClick={openFairUseFromPricing}
        currentPlan={session?.subscription?.type || 'free'}
        initialTab={pricingModalTab}
        onOpenUpgradeModal={() => {
          setShowPricingModal(false);
          setShowUpgradeModal(true);
        }}
        onOpenProfessionalModal={() => {
          setShowPricingModal(false);
          setShowProfessionalModal(true);
        }}
      />
      
      <FairUsePolicyModal 
        isOpen={showFairUseModal}
        onClose={() => setShowFairUseModal(false)}
      />
      
      <ContactModal 
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />

      <UpgradeInterestModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
      
      <ProfessionalServicesModal 
        isOpen={showProfessionalModal}
        onClose={() => setShowProfessionalModal(false)}
      />

    </>
  );
}
