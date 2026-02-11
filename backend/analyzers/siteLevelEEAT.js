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
    if (!domain.startsWith('http')) {
      domain = 'https://' + domain;
    }
    
    const baseUrl = new URL(domain).origin;
    
    // 1. DOMAIN AGE & SSL (20 points)
    const sslCheck = domain.startsWith('https://');
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
    
    // Check domain age (would require WHOIS API - placeholder for now)
    findings.domainAge.details.ageEstimate = 'Requires WHOIS lookup';
    findings.domainAge.score += 10; // Neutral score
    
    // 2. SITE STRUCTURE & KEY PAGES (30 points)
    const keyPages = [
      { path: '/about', name: 'About Page' },
      { path: '/about-us', name: 'About Us Page' },
      { path: '/contact', name: 'Contact Page' },
      { path: '/privacy', name: 'Privacy Policy' },
      { path: '/terms', name: 'Terms of Service' }
    ];
    
    let foundPages = [];
    
    for (const page of keyPages) {
      try {
        const response = await fetch(`${baseUrl}${page.path}`, { method: 'HEAD', timeout: 5000 });
        if (response.ok) {
          foundPages.push(page.name);
          findings.siteStructure.score += 6; // 6 points per page, max 30
        }
      } catch (error) {
        // Page not found
      }
    }
    
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
    
    // Organization schema
    const hasOrgSchema = $('script[type="application/ld+json"]').toArray().some(el => {
      try {
        const json = JSON.parse($(el).html());
        return json['@type'] === 'Organization';
      } catch (e) {
        return false;
      }
    });
    
    findings.trustSignals.details.hasOrganizationSchema = hasOrgSchema;
    if (hasOrgSchema) {
      findings.trustSignals.score += 10;
    } else {
      recommendations.push({
        text: 'Add Organization schema markup to homepage',
        why: 'Organization schema tells AI engines who you are. Without it, they can\'t verify your business identity, location, or contact info.',
        howToFix: 'Add JSON-LD Organization schema to homepage with: name, url, logo, contactPoint, sameAs (social profiles). Use Google\'s Structured Data Testing Tool to validate.',
        priority: 'high'
      });
    }
    
    // Contact information
    const mainContent = $('body').text().toLowerCase();
    const hasEmail = /@[\w\-]+\.[\w]{2,}/gi.test(mainContent);
    const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(mainContent);
    
    findings.trustSignals.details.hasVisibleEmail = hasEmail;
    findings.trustSignals.details.hasVisiblePhone = hasPhone;
    
    if (hasEmail) findings.trustSignals.score += 5;
    if (hasPhone) findings.trustSignals.score += 5;
    
    if (!hasEmail) {
      recommendations.push({
        text: 'Display contact email prominently',
        why: 'No visible email found. Transparent contact info is core to trustworthiness. Hidden contact signals spam or low-quality sites.',
        howToFix: 'Add business email to footer, About page, and Contact page. Use real domain email (not Gmail), e.g., info@yourdomain.com.',
        priority: 'high'
      });
    }
    
    // Author information
    const hasAuthorBios = $('[itemtype*="Person"], .author, [rel="author"]').length > 0;
    findings.trustSignals.details.hasAuthorBios = hasAuthorBios;
    
    if (hasAuthorBios) {
      findings.trustSignals.score += 10;
    } else {
      recommendations.push({
        text: 'Add author bios with credentials',
        why: 'No author information found. AI engines prioritize content from identifiable experts. Anonymous content is less trustworthy.',
        howToFix: 'Create author profile pages with: full name, credentials, photo, social links. Add author bylines to articles with link to profile.',
        priority: 'medium'
      });
    }
    
    // 4. AUTHORITY METRICS (20 points) - COMING SOON
    findings.authorityMetrics.details.status = 'Coming Soon';
    findings.authorityMetrics.details.providers = {
      mozDomainAuthority: {
        available: false,
        comingSoon: true,
        provider: 'Moz',
        description: '0-100 scale measuring link authority',
        learnMore: 'https://moz.com/domain-analysis'
      },
      ahrefsDomainRating: {
        available: false,
        comingSoon: true,
        provider: 'Ahrefs',
        description: '0-100 scale measuring backlink strength',
        learnMore: 'https://ahrefs.com/domain-rating'
      },
      semrushAuthorityScore: {
        available: false,
        comingSoon: true,
        provider: 'Semrush',
        description: '0-100 scale measuring overall authority',
        learnMore: 'https://www.semrush.com/kb/840-authority-score'
      }
    };
    
    recommendations.push({
      text: 'External Authority Metrics - Available Soon',
      why: 'Domain authority metrics from Moz, Ahrefs, and Semrush provide powerful third-party validation. Coming soon: Direct API integration to show your DA/DR/AS scores here.',
      howToFix: 'Stay tuned! We\'re adding integrations with major SEO platforms. In the meantime, you can check your scores at the provider links above.',
      priority: 'low'
    });
    
    findings.authorityMetrics.score = 0; // Placeholder until APIs integrated
    
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