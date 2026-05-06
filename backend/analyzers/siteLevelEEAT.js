const axios = require('axios');
const whois = require('whois-json');
const { fetchPage } = require('../utils/pageFetcher');
const { extractText, getAllText } = require('../utils/shared');

/**
 * Analyzer 6: Site-Level E-E-A-T
 * Evaluates domain-wide trust signals
 */
async function analyzeSiteLevelEEAT(domain) {
  const findings = {
    domainAge: { score: 0, details: {} },
    siteStructure: { score: 0, details: {} },
    trustSignals: { score: 0, details: {} },
    authorityMetrics: { score: 0, details: {} }
  };
  
  const recommendations = [];
  
  try {
    // Ensure domain has protocol
    let domainWithProtocol = domain;
    if (!domainWithProtocol.startsWith('http')) {
      domainWithProtocol = 'https://' + domainWithProtocol;
    }
    
    const urlObj = new URL(domainWithProtocol);
    const baseUrl = urlObj.origin;
    const hostname = urlObj.hostname;
    
    // 1. DOMAIN AGE & SSL (20 points)
    const sslCheck = domainWithProtocol.startsWith('https://');
    findings.domainAge.details.hasSSL = sslCheck;
    
    if (sslCheck) {
      findings.domainAge.score += 10;
    } else {
      recommendations.push({
        text: 'CRITICAL: Enable HTTPS/SSL certificate',
        why: 'HTTPS is mandatory for E-E-A-T. AI engines will not trust or cite HTTP sites. Google penalizes non-HTTPS sites heavily.',
        howToFix: 'Purchase and install an SSL certificate from your hosting provider. Most hosts offer free Let\'s Encrypt certificates. Update all internal links to HTTPS.',
        priority: 'critical'
      });
    }
    
    // Check domain age using WHOIS
    try {
      const whoisData = await Promise.race([
        whois(hostname),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
      ]);

      if (whoisData && (whoisData.creationDate || whoisData.created)) {
        const createdDate = new Date(whoisData.creationDate || whoisData.created);
        const ageInMs = Date.now() - createdDate.getTime();
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
        
        findings.domainAge.details.ageEstimate = `${Math.floor(ageInYears)} years`;
        findings.domainAge.details.creationDate = createdDate.toISOString().split('T')[0];
        
        if (ageInYears >= 5) {
          findings.domainAge.score += 10;
        } else if (ageInYears >= 2) {
          findings.domainAge.score += 7;
        } else {
          findings.domainAge.score += 5;
        }
      } else {
        throw new Error('Incomplete WHOIS data');
      }
    } catch (whoisError) {
      console.warn(`WHOIS lookup failed for ${hostname}:`, whoisError.message);
      findings.domainAge.details.ageEstimate = 'Provider Unavailable (±10 points margin)';
      findings.domainAge.score += 5; // Mid-range baseline
      
      recommendations.push({
        text: 'WHOIS Lookup Failed (±10 points margin)',
        why: 'We could not verify your domain age due to WHOIS provider rate limits or timeouts. This may cause an error margin of ±10 points in your total score.',
        howToFix: 'Ensure your domain privacy settings allow for public WHOIS queries if you want a precise score.',
        priority: 'low'
      });
    }
    
    // 2. SITE STRUCTURE & KEY PAGES (30 points)
    const keyPages = [
      { path: '/about', name: 'About Page' },
      { path: '/about-us', name: 'About Us Page' },
      { path: '/contact', name: 'Contact Page' },
      { path: '/privacy', name: 'Privacy Policy' },
      { path: '/terms', name: 'Terms of Service' }
    ];
    
    let foundPages = [];
    
    // Check pages using GET instead of HEAD for better compatibility with SPA hosts
    await Promise.all(keyPages.map(async (page) => {
      try {
        const response = await axios.get(`${baseUrl}${page.path}`, { 
          timeout: 5000, 
          validateStatus: (status) => status === 200,
          maxContentLength: 5000 // Only need the start
        });
        if (response.status === 200) {
          foundPages.push(page.name);
          findings.siteStructure.score += 6; 
        }
      } catch (error) {
        // Page not found or error
      }
    }));
    
    findings.siteStructure.details.keyPagesFound = foundPages;
    findings.siteStructure.details.missingPages = keyPages
      .filter(p => !foundPages.includes(p.name))
      .map(p => p.name);
    
    if (foundPages.length < 3) {
      recommendations.push({
        text: 'Add critical trust pages (About, Contact, Privacy)',
        why: `Only ${foundPages.length}/5 trust pages found. AI engines check for About, Contact, Privacy Policy pages to verify legitimacy. Missing pages signal untrustworthiness.`,
        howToFix: 'Create: /about (company/author info), /contact (email, phone, address), /privacy (data policy), /terms (usage terms). Make them detailed and transparent.',
        priority: 'critical'
      });
    }
    
    // 3. TRUST SIGNALS (30 points)
    const { $ } = await fetchPage(baseUrl);
    
    // Enhanced Schema Detection (handles @graph and arrays)
    const jsonLdBlocks = $('script[type="application/ld+json"]').toArray().map(el => {
      try {
        return JSON.parse($(el).html());
      } catch (e) { return null; }
    }).filter(Boolean);

    const hasOrgSchema = jsonLdBlocks.some(json => {
      const check = (item) => {
        if (item['@type'] === 'Organization') return true;
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          return item['@graph'].some(inner => inner['@type'] === 'Organization');
        }
        return false;
      };
      return Array.isArray(json) ? json.some(check) : check(json);
    });
    
    findings.trustSignals.details.hasOrganizationSchema = hasOrgSchema;
    if (hasOrgSchema) {
      findings.trustSignals.score += 10;
    } else {
      recommendations.push({
        text: 'Add Organization schema markup to homepage',
        why: 'Organization schema tells AI engines who you are. Without it, they can\'t verify your business identity, location, or contact info.',
        howToFix: 'Add JSON-LD Organization schema to homepage with: name, url, logo, contactPoint, sameAs (social profiles). Use the @graph structure for best compatibility.',
        priority: 'high'
      });
    }
    
    // Contact information (with metadata fallback for SPAs)
    const mainContent = $('body').text().toLowerCase();
    const jsonString = JSON.stringify(jsonLdBlocks).toLowerCase();
    
    const emailRegex = /@[\w\-]+\.[\w]{2,}/gi;
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    
    const hasEmail = emailRegex.test(mainContent) || emailRegex.test(jsonString);
    const hasPhone = phoneRegex.test(mainContent) || phoneRegex.test(jsonString);
    
    findings.trustSignals.details.hasVisibleEmail = hasEmail;
    findings.trustSignals.details.hasVisiblePhone = hasPhone;
    
    if (hasEmail) findings.trustSignals.score += 5;
    if (hasPhone) findings.trustSignals.score += 5;
    
    if (!hasEmail) {
      recommendations.push({
        text: 'Display contact email prominently',
        why: 'No visible email found in content or metadata. Transparent contact info is core to trustworthiness for AI engines.',
        howToFix: 'Add business email to footer or JSON-LD schema (ContactPoint). Use real domain email, e.g., info@yourdomain.com.',
        priority: 'high'
      });
    }
    
    // Author information
    const hasAuthorBios = $('[itemtype*="Person"], .author, [rel="author"]').length > 0 || jsonString.includes('"person"');
    findings.trustSignals.details.hasAuthorBios = hasAuthorBios;
    
    if (hasAuthorBios) {
      findings.trustSignals.score += 10;
    } else {
      recommendations.push({
        text: 'Add author bios with credentials',
        why: 'No author information found. AI engines prioritize content from identifiable experts. Anonymous content is less trustworthy.',
        howToFix: 'Create author profile pages or add Person schema to your JSON-LD blocks.',
        priority: 'medium'
      });
    }
    
    // 4. AUTHORITY METRICS (20 points) - Balanced Weighting
    findings.authorityMetrics.details.status = 'Balanced Weighting Active';
    findings.authorityMetrics.score = 0; 
    
    // Calculate total score
    const totalScore = findings.domainAge.score + findings.siteStructure.score + 
                      findings.trustSignals.score + findings.authorityMetrics.score;
    
    const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
    const sortedRecommendations = recommendations
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 10);
    
    return {
      score: totalScore,
      grade: getGrade(totalScore),
      findings,
      recommendations: sortedRecommendations,
      details: {
        maxScore: 100,
        breakdown: {
          domainAge: { score: findings.domainAge.score, max: 20 },
          siteStructure: { score: findings.siteStructure.score, max: 30 },
          trustSignals: { score: findings.trustSignals.score, max: 30 },
          authorityMetrics: { score: findings.authorityMetrics.score, max: 20 }
        }
      }
    };
    
  } catch (error) {
    console.error('Site-level E-E-A-T analysis error:', error);
    return {
      score: 0,
      grade: 'F',
      findings,
      recommendations: [{
        text: 'Error analyzing site-level E-E-A-T',
        why: 'Could not complete site-wide analysis. This may be due to connectivity issues or site access restrictions.',
        howToFix: 'Try again later or contact support if the issue persists.',
        priority: 'high'
      }],
      details: {
        error: error.message
      }
    };
  }
}

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

module.exports = { analyzeSiteLevelEEAT };