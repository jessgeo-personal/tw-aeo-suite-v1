import React, { useState, useEffect } from 'react';

// Import components
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { LeadCaptureModal, OTPModal } from './components/LeadCaptureModal';
import PricingModal from './components/PricingModal';
import FairUsePolicyModal from './components/FairUsePolicyModal';
import ContactModal from './components/ContactModal';
import StatsBanner from './components/StatsBanner';
import UpgradeInterestModal from './components/UpgradeInterestModal';
import ProfessionalServicesModal from './components/ProfessionalServicesModal';

import './App.css';

// API URL from environment variable with fallback
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ===========================================
// API HELPER FUNCTIONS
// ===========================================
const api = {
  checkSession: async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/session`, { credentials: 'include' });
      return res.ok ? await res.json() : null;
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
      if (res.status === 429) {
        throw new Error('Daily limit reached. Please upgrade for unlimited analyses.');
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
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
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
      setShowLeadModal(true);
    } else {
      setUrl(landingUrl);
      setShowLanding(false);
      setTimeout(() => handleAnalyze(landingUrl), 100);
    }
  };

  const handleLoginClick = () => {
    setPendingUrl('');
    setAutoAnalyzeAfterAuth(false);
    setShowLeadModal(true);
  };

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
        setTimeout(() => handleAnalyze(pendingUrl), 300);
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
    setResults(null);
    setUrlTabs([]);
    setShowLanding(true);
  };

  // ===========================================
  // ANALYSIS HANDLERS
  // ===========================================
  const handleAnalyze = async (targetUrl = url) => {
    if (!session) {
      setShowLeadModal(true);
      return;
    }

    if (!targetUrl.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await api.analyze(activeTool, targetUrl, queries);
      setResults(data);
      await loadLimits();
      
      // Update tabs
      const existingTab = urlTabs.findIndex(tab => tab.url === targetUrl);
      if (existingTab === -1) {
        setUrlTabs([...urlTabs, { url: targetUrl, tool: activeTool, results: data }]);
        setActiveTabIndex(urlTabs.length);
      } else {
        const newTabs = [...urlTabs];
        newTabs[existingTab] = { url: targetUrl, tool: activeTool, results: data };
        setUrlTabs(newTabs);
        setActiveTabIndex(existingTab);
      }
    } catch (e) {
      // User-friendly error messages
      let errorMessage = 'Analysis failed. Please try again.';
      
      if (e.message.includes('SSL') || e.message.includes('EPROTO')) {
        errorMessage = 'Unable to connect to this website. The site may be blocking automated requests or have connection issues.';
      } else if (e.message.includes('timeout') || e.message.includes('ETIMEDOUT')) {
        errorMessage = 'The website took too long to respond. Please try again or use a different URL.';
      } else if (e.message.includes('404') || e.message.includes('not found')) {
        errorMessage = 'Website not found. Please check the URL and try again.';
      } else if (e.message.includes('limit')) {
        errorMessage = 'Daily limit reached. Please upgrade for unlimited analyses.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
    }
    setLoading(false);
  };

  const handleTabClick = (idx) => {
    setActiveTabIndex(idx);
    const tab = urlTabs[idx];
    if (tab) {
      setUrl(tab.url);
      setResults(tab.results);
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
        setResults(tab.results);
      }
    } else if (newTabs.length === 0) {
      setUrl('');
      setResults(null);
    }
  };

  const handleNewTab = () => {
    setUrl('');
    setResults(null);
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

  const closeOTPModal = () => {
    setShowOTPModal(false);
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
        
        {/* Auth Modals */}
        {showLeadModal && (
          <LeadCaptureModal
            onSubmit={handleLeadSubmit}
            onClose={closeLeadModal}
            loading={authLoading}
            error={authError}
            url={pendingUrl}
          />
        )}
        
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
        setActiveTool={setActiveTool}
        
        // URL & Analysis
        url={url}
        setUrl={setUrl}
        queries={queries}
        setQueries={setQueries}
        loading={loading}
        error={error}
        results={results}
        onAnalyze={() => handleAnalyze()}
        
        // Tabs
        urlTabs={urlTabs}
        activeTabIndex={activeTabIndex}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onNewTab={handleNewTab}
        
        // Usage
        limits={limits}
        
        // Modals
        onUpgradeClick={openPricingModalSelfService}
        onProfessionalClick={openPricingModalProfessional}
        onContactClick={() => setShowContactModal(true)}
      />

      {/* Modals (shared between landing & dashboard) */}
      {showLeadModal && (
        <LeadCaptureModal
          onSubmit={handleLeadSubmit}
          onClose={closeLeadModal}
          loading={authLoading}
          error={authError}
          url={pendingUrl}
        />
      )}
      
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