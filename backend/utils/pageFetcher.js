const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Detect if error indicates bot blocking
 * @param {Error} error - Axios error object
 * @param {object} response - Axios response (if available)
 * @returns {object} - Detection result with details
 */
function detectBotBlocking(error, response = null) {
  const detection = {
    isBlocked: false,
    blockType: null,
    evidence: [],
    recommendation: '',
    aeoImpact: ''
  };

  // Check HTTP status codes that indicate blocking
  if (response && response.status) {
    const status = response.status;
    
    if (status === 403) {
      detection.isBlocked = true;
      detection.blockType = 'HTTP 403 Forbidden';
      detection.evidence.push('Server returned 403 Forbidden - access denied');
      detection.recommendation = 'Check robots.txt and ensure your site allows AI crawlers';
      detection.aeoImpact = 'CRITICAL: AI search engines are likely being blocked from accessing your content';
    } else if (status === 429) {
      detection.isBlocked = true;
      detection.blockType = 'Rate Limiting';
      detection.evidence.push('Server returned 429 Too Many Requests');
      detection.recommendation = 'Adjust rate limiting rules to allow legitimate AI crawlers';
      detection.aeoImpact = 'HIGH: Aggressive rate limiting may prevent AI engines from fully indexing your content';
    } else if (status === 503) {
      detection.isBlocked = true;
      detection.blockType = 'Service Unavailable / WAF';
      detection.evidence.push('Server returned 503 Service Unavailable');
      detection.recommendation = 'Check if WAF/CDN is blocking automated requests';
      detection.aeoImpact = 'HIGH: Web Application Firewall may be blocking AI crawlers';
    }
  }

  // Check for common bot detection patterns in HTML
  if (response && response.data && typeof response.data === 'string') {
    const html = response.data.toLowerCase();
    
    // Cloudflare challenge detection
    if (html.includes('cloudflare') && (html.includes('challenge') || html.includes('checking your browser'))) {
      detection.isBlocked = true;
      detection.blockType = 'Cloudflare Bot Challenge';
      detection.evidence.push('Cloudflare bot challenge page detected');
      detection.recommendation = 'Configure Cloudflare to allow verified AI crawlers (ChatGPT, Perplexity, etc.)';
      detection.aeoImpact = 'CRITICAL: Cloudflare is blocking AI search engines with JavaScript challenges';
    }
    
    // Imperva/Incapsula detection
    if (html.includes('incapsula') || html.includes('imperva')) {
      detection.isBlocked = true;
      detection.blockType = 'Imperva/Incapsula WAF';
      detection.evidence.push('Imperva/Incapsula WAF detected');
      detection.recommendation = 'Whitelist AI crawler IPs in Imperva/Incapsula settings';
      detection.aeoImpact = 'CRITICAL: WAF is blocking AI search engine crawlers';
    }
    
    // reCAPTCHA detection
    if (html.includes('recaptcha') || html.includes('google.com/recaptcha')) {
      detection.isBlocked = true;
      detection.blockType = 'reCAPTCHA Challenge';
      detection.evidence.push('Google reCAPTCHA challenge detected');
      detection.recommendation = 'Implement selective reCAPTCHA that doesn\'t block AI crawlers';
      detection.aeoImpact = 'CRITICAL: reCAPTCHA prevents AI engines from accessing content';
    }
    
    // Generic "Access Denied" patterns
    if (html.includes('access denied') || html.includes('blocked') || html.includes('forbidden')) {
      detection.isBlocked = true;
      detection.blockType = 'Access Denied Page';
      detection.evidence.push('Generic access denied message detected in page content');
      detection.recommendation = 'Review server security rules and allow legitimate crawlers';
      detection.aeoImpact = 'HIGH: Generic blocking may affect AI crawler access';
    }
  }

  // Check timeout errors
  if (error && (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED')) {
    detection.isBlocked = true;
    detection.blockType = 'Connection Timeout';
    detection.evidence.push('Request timed out after 30 seconds');
    detection.recommendation = 'Server response time may be too slow or deliberately throttled for bots';
    detection.aeoImpact = 'MEDIUM: Slow response times may cause AI crawlers to give up before indexing';
  }

  // Check connection refused
  if (error && error.code === 'ECONNREFUSED') {
    detection.isBlocked = true;
    detection.blockType = 'Connection Refused';
    detection.evidence.push('Server actively refused connection');
    detection.recommendation = 'Firewall or security software may be blocking automated requests';
    detection.aeoImpact = 'HIGH: Firewall rules may be blocking AI crawler IPs';
  }

  // Check for no response (complete silence)
  if (error && error.request && !error.response) {
    detection.isBlocked = true;
    detection.blockType = 'No Response / Silent Drop';
    detection.evidence.push('Server did not respond at all (possible IP blocking)');
    detection.recommendation = 'Check IP allowlists and ensure AI crawler IPs aren\'t blocked';
    detection.aeoImpact = 'CRITICAL: IP-based blocking is preventing all AI crawler access';
  }

  return detection;
}

/**
 * Fetch and parse a web page with enhanced error detection
 * @param {string} url - URL to fetch
 * @param {object} options - Axios options
 * @returns {object} - Cheerio object and response data
 */
async function fetchPage(url, options = {}) {
  let response = null;
  
  try {
    // Validate URL
    new URL(url);
    
    // Default axios configuration
    const config = {
      url,
      method: 'GET',
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AEO-Audit-Bot/1.0; +https://thatworkx.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      },
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 500, // Accept more status codes for detection
      ...options
    };
    
    response = await axios(config);
    
    // Check for bot blocking even on successful response
    const blockDetection = detectBotBlocking(null, response);
    
    // If blocked with special page (200 OK but contains block content)
    if (blockDetection.isBlocked && response.status === 200) {
      const error = new Error('Bot blocking detected');
      error.blockDetection = blockDetection;
      throw error;
    }
    
    // If status indicates blocking
    if (response.status >= 400) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.blockDetection = detectBotBlocking(null, response);
      throw error;
    }
    
    // Parse HTML with Cheerio
    const $ = cheerio.load(response.data);
    
    return {
      $,
      html: response.data,
      statusCode: response.status,
      headers: response.headers,
      url: response.config.url, // Final URL after redirects
      redirected: response.request._redirectable._redirectCount > 0,
      blockDetection: null // No blocking detected
    };
    
  } catch (error) {
    // Enhance error with bot blocking detection
    let blockDetection = detectBotBlocking(error, response);
    
    // If we already detected blocking, use that info
    if (error.blockDetection) {
      blockDetection = error.blockDetection;
    }
    
    // Create enhanced error
    const enhancedError = new Error(getEnhancedErrorMessage(error, blockDetection));
    enhancedError.originalError = error;
    enhancedError.blockDetection = blockDetection;
    
    throw enhancedError;
  }
}

/**
 * Generate user-friendly error message with blocking details
 * @param {Error} error - Original error
 * @param {object} blockDetection - Block detection result
 * @returns {string} - Enhanced error message
 */
function getEnhancedErrorMessage(error, blockDetection) {
  if (!blockDetection.isBlocked) {
    // Standard error messages for non-blocking issues
    if (error.code === 'ENOTFOUND') {
      return 'Website not found. Please check the URL.';
    } else if (error.message.includes('Invalid URL')) {
      return 'Invalid URL format. Please check the URL and try again.';
    } else {
      return `Failed to fetch page: ${error.message}`;
    }
  }
  
  // For blocking issues, return detailed message
  return `Bot/crawler blocking detected: ${blockDetection.blockType}`;
}

/**
 * Check if URL is accessible
 * @param {string} url - URL to check
 * @returns {boolean} - True if accessible
 */
async function isAccessible(url) {
  try {
    const response = await axios.head(url, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract robots.txt directives for URL
 * @param {string} url - Website URL
 * @returns {object} - Robots.txt data
 */
async function getRobotsTxt(url) {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    
    const response = await axios.get(robotsUrl, {
      timeout: 10000,
      validateStatus: (status) => status === 200
    });
    
    return {
      exists: true,
      content: response.data,
      url: robotsUrl
    };
  } catch {
    return {
      exists: false,
      content: null,
      url: null
    };
  }
}

module.exports = {
  fetchPage,
  isAccessible,
  getRobotsTxt,
  detectBotBlocking
};