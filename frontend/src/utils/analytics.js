// Analytics utility for GA4 and HubSpot tracking
// Usage: import { trackEvent } from './utils/analytics';

/**
 * Track custom events to Google Analytics 4
 * @param {string} eventName - Event name (e.g., 'analysis_complete')
 * @param {object} eventParams - Event parameters
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track page views manually (auto-tracked on load)
 * @param {string} pagePath - Page path
 * @param {string} pageTitle - Page title
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle
    });
  }
};

/**
 * Track user registration/signup
 * @param {string} method - Registration method (e.g., 'email')
 */
export const trackSignup = (method = 'email') => {
  trackEvent('sign_up', {
    method: method
  });
};

/**
 * Track analysis completion
 * @param {string} url - Website URL analyzed
 * @param {number} score - Overall AEO score
 */
export const trackAnalysisComplete = (url, score) => {
  trackEvent('analysis_complete', {
    url: url,
    score: score,
    event_category: 'engagement'
  });
};

/**
 * Track analyzer view (individual analyzer opened)
 * @param {string} analyzerName - Name of analyzer viewed
 */
export const trackAnalyzerView = (analyzerName) => {
  trackEvent('analyzer_view', {
    analyzer_name: analyzerName,
    event_category: 'engagement'
  });
};

/**
 * Track upgrade/pricing clicks
 * @param {string} tier - Pricing tier clicked
 */
export const trackUpgradeClick = (tier) => {
  trackEvent('upgrade_click', {
    tier: tier,
    event_category: 'conversion'
  });
};

/**
 * Track contact/CTA button clicks
 * @param {string} location - Where the CTA was clicked
 */
export const trackCTAClick = (location) => {
  trackEvent('cta_click', {
    location: location,
    event_category: 'conversion'
  });
};

/**
 * Track email verification completion
 */
export const trackEmailVerified = () => {
  trackEvent('email_verified', {
    event_category: 'engagement'
  });
};

/**
 * Identify user in HubSpot (call after successful login/signup)
 * @param {string} email - User email
 */
export const identifyHubSpotUser = (email) => {
  if (typeof window !== 'undefined' && window._hsq) {
    window._hsq.push(['identify', {
      email: email
    }]);
  }
};

/**
 * Track HubSpot custom event
 * @param {string} eventId - HubSpot event ID
 * @param {object} properties - Event properties
 */
export const trackHubSpotEvent = (eventId, properties = {}) => {
  if (typeof window !== 'undefined' && window._hsq) {
    window._hsq.push(['trackCustomBehavioralEvent', {
      name: eventId,
      properties: properties
    }]);
  }
};

export default {
  trackEvent,
  trackPageView,
  trackSignup,
  trackAnalysisComplete,
  trackAnalyzerView,
  trackUpgradeClick,
  trackCTAClick,
  trackEmailVerified,
  identifyHubSpotUser,
  trackHubSpotEvent
};
