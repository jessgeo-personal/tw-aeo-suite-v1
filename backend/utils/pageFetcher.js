const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetch and parse a web page
 * @param {string} url - URL to fetch
 * @param {object} options - Axios options
 * @returns {object} - Cheerio object and response data
 */
async function fetchPage(url, options = {}) {
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
      validateStatus: (status) => status >= 200 && status < 400,
      ...options
    };
    
    const response = await axios(config);
    
    // Parse HTML with Cheerio
    const $ = cheerio.load(response.data);
    
    return {
      $,
      html: response.data,
      statusCode: response.status,
      headers: response.headers,
      url: response.config.url, // Final URL after redirects
      redirected: response.request._redirectable._redirectCount > 0
    };
    
  } catch (error) {
    // Handle errors
    if (error.response) {
      // Server responded with error status
      throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response
      throw new Error('No response received from server. The website may be down or blocking requests.');
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Website not found. Please check the URL.');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. The website may be slow or unresponsive.');
    } else if (error.message.includes('Invalid URL')) {
      throw new Error('Invalid URL format. Please check the URL and try again.');
    } else {
      throw new Error(`Failed to fetch page: ${error.message}`);
    }
  }
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
async function checkRobotsTxt(url) {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    
    const response = await axios.get(robotsUrl, {
      timeout: 10000,
      validateStatus: (status) => status === 200
    });
    
    const content = response.data;
    const lines = content.split('\n');
    
    let currentUserAgent = null;
    const rules = {
      '*': { allow: [], disallow: [] }
    };
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed) return;
      
      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        currentUserAgent = trimmed.split(':')[1].trim();
        if (!rules[currentUserAgent]) {
          rules[currentUserAgent] = { allow: [], disallow: [] };
        }
      } else if (trimmed.toLowerCase().startsWith('allow:')) {
        const path = trimmed.split(':')[1].trim();
        if (currentUserAgent && rules[currentUserAgent]) {
          rules[currentUserAgent].allow.push(path);
        }
      } else if (trimmed.toLowerCase().startsWith('disallow:')) {
        const path = trimmed.split(':')[1].trim();
        if (currentUserAgent && rules[currentUserAgent]) {
          rules[currentUserAgent].disallow.push(path);
        }
      }
    });
    
    return {
      exists: true,
      content,
      rules
    };
    
  } catch {
    return {
      exists: false,
      content: null,
      rules: null
    };
  }
}

module.exports = {
  fetchPage,
  isAccessible,
  checkRobotsTxt
};
