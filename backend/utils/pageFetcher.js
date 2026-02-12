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
    blockingType: null,
    affectedCrawlers: [],
    evidence: {
      detectedSignatures: [],
      httpStatusCode: null,
      responseIndicators: []
    },
    impact: '',
    recommendation: ''
  };

  // Check HTTP status codes that indicate blocking
  if (response && response.status) {
    const status = response.status;
    detection.evidence.httpStatusCode = status;
    
    if (status === 403) {
      detection.isBlocked = true;
      detection.blockingType = 'http_403_forbidden';
      detection.evidence.detectedSignatures.push('Server returned 403 Forbidden - access denied');
      detection.recommendation = 'Check robots.txt and ensure your site allows AI crawlers';
      detection.impact = 'CRITICAL: AI search engines are likely being blocked from accessing your content';
    } else if (status === 429) {
      detection.isBlocked = true;
      detection.blockingType = 'rate_limiting';
      detection.evidence.detectedSignatures.push('Server returned 429 Too Many Requests');
      detection.recommendation = 'Adjust rate limiting rules to allow legitimate AI crawlers';
      detection.impact = 'HIGH: Aggressive rate limiting may prevent AI engines from fully indexing your content';
    } else if (status === 503) {
      detection.isBlocked = true;
      detection.blockingType = 'service_unavailable_waf';
      detection.evidence.detectedSignatures.push('Server returned 503 Service Unavailable');
      detection.recommendation = 'Check if WAF/CDN is blocking automated requests';
      detection.impact = 'HIGH: Web Application Firewall may be blocking AI crawlers';
    }
  }

  // Check for common bot detection patterns in HTML
  if (response && response.data && typeof response.data === 'string') {
    const html = response.data.toLowerCase();
    
    // Cloudflare challenge detection
    if (html.includes('cloudflare') && (html.includes('challenge') || html.includes('checking your browser'))) {
      detection.isBlocked = true;
      detection.blockingType = 'cloudflare_challenge';
      detection.evidence.detectedSignatures.push('Cloudflare bot challenge page detected');
      detection.evidence.responseIndicators.push('Challenge page HTML pattern detected');
      
      // Detailed step-by-step instructions
      detection.recommendation = `CLOUDFLARE FIX: Allow AI Crawlers & AEO Bot

METHOD 1: Enable Verified Bots (Recommended - Allows ALL legitimate AI bots)
1. Log into Cloudflare Dashboard → Select your domain
2. Go to Security → Bots
3. Under "Bot Fight Mode" section:
  - Enable "Allow verified bots" toggle
  - This automatically allows: GPTBot, ClaudeBot, Google-Extended, Perplexity, Bingbot, and other verified crawlers

METHOD 2: Custom WAF Rule for Specific Bots (More Control)
1. Go to Security → WAF → Custom rules
2. Click "Create rule"
3. Rule name: "Allow AI Crawlers and AEO Bot"
4. Expression:
  (http.user_agent contains "GPTBot") or
  (http.user_agent contains "ClaudeBot") or
  (http.user_agent contains "Google-Extended") or
  (http.user_agent contains "PerplexityBot") or
  (http.user_agent contains "Bingbot") or
  (http.user_agent contains "AIOptimizeBot")
5. Action: Skip → Select "All remaining custom rules"
6. Click "Deploy"

METHOD 3: IP Allowlist for AEO Analyzer (For our bot only)
1. Go to Security → WAF → Tools
2. Under "IP Access Rules"
3. Add IP: [Contact support@thatworkx.com for our bot's IP]
4. Action: Allow
5. Zone: This website

VERIFY IT WORKS:
After configuration, test at: https://aeo.thatworkx.com
Run a new analysis - you should see full results instead of blocking errors.

IMPORTANT: These changes typically take effect within 2-3 minutes.`;
      
      detection.impact = 'CRITICAL: Cloudflare is blocking AI search engines (ChatGPT, Claude, Perplexity, Google AI) AND the AEO analyzer. This means AI-powered search tools CANNOT access your content to include it in their answers. You are invisible to 60% of searches that now use AI.';
      
      // Add specific bot list
      detection.affectedCrawlers = [
        'ChatGPT (GPTBot)',
        'Claude (ClaudeBot)',
        'Perplexity (PerplexityBot)',
        'Google AI (Google-Extended)',
        'Microsoft Copilot (Bingbot)',
        'AEO Analyzer (AIOptimizeBot)'
      ];
    }
    
    // Imperva/Incapsula detection
    if (html.includes('incapsula') || html.includes('imperva')) {
      detection.isBlocked = true;
      detection.blockingType = 'imperva_incapsula_waf';
      detection.evidence.detectedSignatures.push('Imperva/Incapsula WAF detected');
      detection.evidence.responseIndicators.push('WAF signature in HTML');
      detection.recommendation = 'Whitelist AI crawler IPs in Imperva/Incapsula settings';
      detection.impact = 'CRITICAL: WAF is blocking AI search engine crawlers';
      detection.affectedCrawlers = [
        'ChatGPT (GPTBot)',
        'Claude (ClaudeBot)',
        'Perplexity (PerplexityBot)',
        'Google AI (Google-Extended)',
        'Microsoft Copilot (Bingbot)'
      ];
    }
    
    // reCAPTCHA detection
    if (html.includes('recaptcha') || html.includes('google.com/recaptcha')) {
      detection.isBlocked = true;
      detection.blockingType = 'recaptcha_challenge';
      detection.evidence.detectedSignatures.push('Google reCAPTCHA challenge detected');
      detection.evidence.responseIndicators.push('reCAPTCHA script detected');
      detection.recommendation = 'Implement selective reCAPTCHA that doesn\'t block AI crawlers';
      detection.impact = 'CRITICAL: reCAPTCHA prevents AI engines from accessing content';
      detection.affectedCrawlers = [
        'ChatGPT (GPTBot)',
        'Claude (ClaudeBot)',
        'Perplexity (PerplexityBot)',
        'Google AI (Google-Extended)'
      ];
    }
    
    // Generic "Access Denied" patterns
    if (html.includes('access denied') || html.includes('blocked') || html.includes('forbidden')) {
      detection.isBlocked = true;
      detection.blockingType = 'access_denied';
      detection.evidence.detectedSignatures.push('Generic access denied message detected in page content');
      detection.evidence.responseIndicators.push('Blocking keywords in HTML');
      detection.recommendation = 'Review server security rules and allow legitimate crawlers';
      detection.impact = 'HIGH: Generic blocking may affect AI crawler access';
      detection.affectedCrawlers = ['All AI crawlers'];
    }
  }

  // Check timeout errors
  if (error && (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED')) {
    detection.isBlocked = true;
    detection.blockingType = 'connection_timeout';
    detection.evidence.detectedSignatures.push('Request timed out after 30 seconds');
    detection.evidence.responseIndicators.push('Network timeout');
    detection.recommendation = 'Server response time may be too slow or deliberately throttled for bots';
    detection.impact = 'MEDIUM: Slow response times may cause AI crawlers to give up before indexing';
    detection.affectedCrawlers = ['All AI crawlers'];
  }

  // Check connection refused
  if (error && error.code === 'ECONNREFUSED') {
    detection.isBlocked = true;
    detection.blockingType = 'connection_refused';
    detection.evidence.detectedSignatures.push('Server actively refused connection');
    detection.evidence.responseIndicators.push('Connection rejected at network level');
    detection.recommendation = 'Firewall or security software may be blocking automated requests';
    detection.impact = 'HIGH: Firewall rules may be blocking AI crawler IPs';
    detection.affectedCrawlers = ['All AI crawlers'];
  }

  // Check for no response (complete silence)
  if (error && error.request && !error.response) {
    detection.isBlocked = true;
    detection.blockingType = 'no_response';
    detection.evidence.detectedSignatures.push('Server did not respond at all (possible IP blocking)');
    detection.evidence.responseIndicators.push('Silent connection drop');
    detection.recommendation = 'Check IP allowlists and ensure AI crawler IPs aren\'t blocked';
    detection.impact = 'CRITICAL: IP-based blocking is preventing all AI crawler access';
    detection.affectedCrawlers = ['All AI crawlers'];
  }

  return detection;
}


/**
 * Check robots.txt and respect disallow rules
 * @param {string} url - URL to check
 * @param {string} userAgent - Bot user agent
 * @returns {boolean} - True if allowed, false if disallowed
 */
async function checkRobotsTxt(url, userAgent = 'AIOptimizeBot') {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    
    const response = await axios.get(robotsUrl, {
      timeout: 5000,
      validateStatus: (status) => status === 200
    });
    
    const robotsTxt = response.data;
    const lines = robotsTxt.split('\n');
    
    let currentUserAgent = null;
    let isOurBot = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for User-agent directive
      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        const agent = trimmed.substring(11).trim();
        currentUserAgent = agent;
        isOurBot = agent === '*' || agent.toLowerCase().includes('aioptimizebot');
      }
      
      // Check for Disallow directive
      if (isOurBot && trimmed.toLowerCase().startsWith('disallow:')) {
        const path = trimmed.substring(9).trim();
        
        // If disallow everything
        if (path === '/') {
          console.log(`🚫 Robots.txt blocks AIOptimizeBot from ${url}`);
          return false;
        }
        
        // If disallow specific path that matches our URL
        if (path && urlObj.pathname.startsWith(path)) {
          console.log(`🚫 Robots.txt blocks AIOptimizeBot from ${urlObj.pathname}`);
          return false;
        }
      }
    }
    
    return true; // Allowed by default
    
  } catch (error) {
    // If robots.txt doesn't exist or can't be fetched, assume allowed
    return true;
  }
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

    // Check robots.txt compliance
    const robotsAllowed = await checkRobotsTxt(url);
    if (!robotsAllowed) {
      const error = new Error('Access blocked by robots.txt');
      error.blockDetection = {
        isBlocked: true,
        blockType: 'Robots.txt Disallow',
        evidence: ['Site owner has blocked AIOptimizeBot in robots.txt'],
        recommendation: 'This site has explicitly disallowed our bot. Respect their wishes.',
        aeoImpact: 'NEUTRAL: Site owner preference to block analysis'
      };
      throw error;
    }
    
    // Default axios configuration
    const config = {
      url,
      method: 'GET',
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIOptimizeBot/1.0; +https://aeo.thatworkx.com/aeo-bot.html)',
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