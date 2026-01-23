const {
  getGrade,
  extractText,
  getMetaContent,
  hasElement,
  countElements,
  getAllText,
  hasSchemaType,
  containsPattern
} = require('../utils/shared');

/**
 * Analyzer 3: Page-Level E-E-A-T
 * Evaluates Experience, Expertise, Authoritativeness, Trustworthiness
 */
async function analyzePageLevelEEAT($, url) {
  const findings = {
    experience: { score: 0, details: {} },
    expertise: { score: 0, details: {} },
    authoritativeness: { score: 0, details: {} },
    trustworthiness: { score: 0, details: {} }
  };
  
  const recommendations = [];
  const mainContent = $('article, main, body').first().text();
  
  // 1. EXPERIENCE SIGNALS (25 points)
  // First-person language indicating direct experience
  const experiencePatterns = [
    /\bI\s+(tested|tried|used|experienced|found|discovered)\b/gi,
    /\bwe\s+(tested|tried|used|implemented|discovered)\b/gi,
    /\bin\s+my\s+experience\b/gi,
    /\bafter\s+using\b/gi
  ];
  
  let experienceCount = 0;
  experiencePatterns.forEach(pattern => {
    const matches = mainContent.match(pattern);
    if (matches) experienceCount += matches.length;
  });
  
  findings.experience.details.experienceIndicators = experienceCount;
  
  if (experienceCount >= 5) {
    findings.experience.score += 15;
  } else if (experienceCount >= 2) {
    findings.experience.score += 10;
    recommendations.push({
      text: 'Add more first-hand experience details to strengthen E-E-A-T signals',
      why: 'You have ' + experienceCount + ' experience indicators, but AI engines strongly favor content with 5+ first-hand experiences. First-person accounts ("I tested", "we tried", "in my experience") signal genuine expertise and are heavily weighted in citation decisions.',
      howToFix: 'Add more first-person language throughout your content. Share specific testing results, personal observations, challenges you faced, and lessons learned. Use phrases like "I tested", "we found", "in my experience", "after using for X months". Include specific outcomes and measurements.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Include personal experience and testing details - AI engines prioritize first-hand knowledge',
      why: 'Your content lacks first-hand experience indicators. AI engines heavily prioritize content from people who have actually used, tested, or experienced what they\'re writing about. Without experience signals, content appears theoretical or secondhand, severely reducing citation likelihood.',
      howToFix: 'Rewrite sections to include your direct experience. Share what you personally tested, tried, or discovered. Use first-person language: "I tested", "we implemented", "in our experience". Include specific details: timelines, results, challenges, solutions. Add at least 5 experience indicators throughout your content.',
      priority: 'critical'
    });
  }
  
  // Original images or media
  const images = countElements($, 'img');
  const figures = countElements($, 'figure');
  findings.experience.details.mediaCount = images + figures;
  
  if (images >= 3 || figures >= 1) {
    findings.experience.score += 10;
  } else if (images > 0) {
    findings.experience.score += 5;
    recommendations.push({
      text: 'Add original images or screenshots to demonstrate hands-on experience',
      why: 'You have ' + images + ' images, but AI engines favor content with 3+ visual elements that demonstrate hands-on experience. Original photos, screenshots of actual testing, charts of real data, or before/after images prove you actually did what you\'re describing.',
      howToFix: 'Add more original visual content: screenshots from your testing, photos of actual products/processes, charts showing your results, comparison images, or step-by-step visual guides. Aim for at least 3 images. Use <figure> elements with descriptive <figcaption> tags for best results.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Add visual evidence (photos, screenshots, charts) of your experience',
      why: 'Your content has no images or visual evidence. Visual proof of first-hand experience (screenshots, original photos, test result charts) dramatically strengthens E-E-A-T signals. Without visuals, there\'s no proof you actually did what you\'re describing.',
      howToFix: 'Add at least 3 original images that prove your hands-on experience: screenshots from testing, photos of actual products/processes, charts of your results, comparison images, or step-by-step visuals. Use <figure> and <figcaption> elements. Add descriptive alt text to each image.',
      priority: 'high'
    });
  }
  
  // 2. EXPERTISE SIGNALS (25 points)
  // Author information
  const hasAuthorSchema = hasSchemaType($, 'Person');
  const authorMeta = getMetaContent($, 'author') || getMetaContent($, 'article:author');
  const authorByline = $('[rel="author"], .author, .byline').text();
  
  findings.expertise.details.hasAuthorInfo = hasAuthorSchema || !!authorMeta || !!authorByline;
  findings.expertise.details.authorName = authorMeta || authorByline.trim().substring(0, 100);
  
  if (hasAuthorSchema) {
    findings.expertise.score += 15;
  } else if (authorMeta || authorByline) {
    findings.expertise.score += 10;
    recommendations.push({
      text: 'Add Person schema markup for author to strengthen expertise signals',
      why: 'You have author information (' + (authorMeta || authorByline.trim().substring(0, 50)) + ') but no Person schema. AI engines use Person schema to verify author identity, link to credentials, and assess expertise. Without schema, author information isn\'t machine-readable.',
      howToFix: 'Add Person schema using JSON-LD in your <head> section. Include: @type: "Person", name, url (link to author bio page), jobTitle, affiliation (organization), and sameAs (social profiles). This makes author credentials explicit and machine-readable for AI engines.',
      priority: 'high'
    });
  } else {
    recommendations.push({
      text: 'Add clear author attribution - AI engines heavily weight author credentials',
      why: 'Your content has no visible author attribution. AI engines need to know WHO wrote the content to assess expertise and trustworthiness. Anonymous content is far less likely to be cited, especially for YMYL (Your Money Your Life) topics.',
      howToFix: 'Add clear author information: author byline with full name, author bio with credentials, link to author profile page. Then implement Person schema with author details (name, jobTitle, affiliation, url). Display author visibly on the page, not just in metadata.',
      priority: 'critical'
    });
  }
  
  // Credentials and qualifications mentioned
  const credentialPatterns = [
    /\b(PhD|MD|MBA|certified|licensed|accredited|qualified)\b/gi,
    /\byears of experience\b/gi,
    /\bexpert in\b/gi,
    /\bspecialized in\b/gi
  ];
  
  let credentialCount = 0;
  credentialPatterns.forEach(pattern => {
    const matches = mainContent.match(pattern);
    if (matches) credentialCount += matches.length;
  });
  
  findings.expertise.details.credentialMentions = credentialCount;
  
  if (credentialCount >= 2) {
    findings.expertise.score += 10;
  } else if (credentialCount > 0) {
    findings.expertise.score += 5;
    recommendations.push({
      text: 'Highlight more author credentials and qualifications in content',
      why: 'You mention credentials ' + credentialCount + ' time(s), but AI engines favor content where expertise is prominently stated (2+ mentions). Specific credentials (PhD, certified, X years experience) dramatically increase E-E-A-T scores and citation likelihood.',
      howToFix: 'Add more credential mentions in visible locations: author bio, about section, or within content. Include specific qualifications: degrees (PhD, MD), certifications, years of experience, specializations, awards, publications. Example: "As a certified X with 10 years of experience in Y..."',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Mention author expertise, credentials, or years of experience in the field',
      why: 'Your content doesn\'t mention any credentials, qualifications, or expertise. AI engines assess author expertise to determine if content is trustworthy and citable. Without stated credentials, there\'s no proof of qualification to write authoritatively on the topic.',
      howToFix: 'Add author credentials prominently to your content. Include: specific degrees or certifications, years of experience in the field, professional specializations, relevant training, awards or recognition. Place credentials in the author bio and mention them naturally in content. Example: "In my 10 years as a certified..."',
      priority: 'high'
    });
  }
  
  // 3. AUTHORITATIVENESS SIGNALS (25 points)
  // External links to authoritative sources
  const externalLinks = $('a[href^="http"]').filter((i, el) => {
    const href = $(el).attr('href');
    return href && !href.includes(new URL(url).hostname);
  });
  
  findings.authoritativeness.details.externalLinks = externalLinks.length;
  
  // Check for high-authority domains
  const authorityDomains = ['.gov', '.edu', '.org', 'wikipedia.org', 'nih.gov', 'cdc.gov'];
  let authorityLinkCount = 0;
  
  externalLinks.each((i, el) => {
    const href = $(el).attr('href');
    if (authorityDomains.some(domain => href.includes(domain))) {
      authorityLinkCount++;
    }
  });
  
  findings.authoritativeness.details.authorityLinks = authorityLinkCount;
  
  if (authorityLinkCount >= 3) {
    findings.authoritativeness.score += 15;
  } else if (authorityLinkCount > 0) {
    findings.authoritativeness.score += 10;
    recommendations.push({
      text: 'Add more links to authoritative sources (.gov, .edu, peer-reviewed research)',
      why: 'You have ' + authorityLinkCount + ' links to authoritative sources, but AI engines favor content with 3+ references to high-authority domains (.gov, .edu, .org, peer-reviewed research). These links signal your content is well-researched and fact-based.',
      howToFix: 'Add more links to authoritative sources that support your claims: government data (.gov), academic research (.edu), peer-reviewed studies, industry organizations (.org), established institutions. Cite specific sources inline. Aim for at least 3 authority links.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Link to authoritative sources to support claims and demonstrate research',
      why: 'Your content has no links to authoritative sources (.gov, .edu, .org, peer-reviewed research). Without external authoritative references, AI engines cannot verify your claims or assess if your content is well-researched. Referenced content is exponentially more citable.',
      howToFix: 'Add at least 3 links to high-authority sources: government websites (.gov), academic institutions (.edu), peer-reviewed research, established organizations (.org), or reputable industry sources. Link to specific data, studies, or facts that support your main claims. Place citations inline where relevant.',
      priority: 'high'
    });
  }
  
  // Last updated date
  const dateModified = getMetaContent($, 'article:modified_time') || 
                       getMetaContent($, 'dateModified') ||
                       $('time[datetime]').attr('datetime');
  
  findings.authoritativeness.details.lastUpdated = dateModified || 'Not specified';
  
  if (dateModified) {
    const updateDate = new Date(dateModified);
    const monthsOld = (new Date() - updateDate) / (1000 * 60 * 60 * 24 * 30);
    
    findings.authoritativeness.details.monthsSinceUpdate = Math.round(monthsOld);
    
    if (monthsOld <= 6) {
      findings.authoritativeness.score += 10;
    } else if (monthsOld <= 12) {
      findings.authoritativeness.score += 5;
      recommendations.push({
        text: 'Content is over 6 months old - consider updating with recent information',
        why: 'Your content was last updated ' + Math.round(monthsOld) + ' months ago. AI engines favor fresh, up-to-date content, especially for topics that change frequently. Content over 6 months old may contain outdated information, reducing citation confidence.',
        howToFix: 'Review and update your content with recent data, statistics, examples, and developments. Add new information from the past ' + Math.round(monthsOld) + ' months. Update the dateModified metadata and article:modified_time meta tag with the current date. Mark updated sections visibly.',
        priority: 'medium'
      });
    } else {
      recommendations.push({
        text: 'Content is outdated - update with current data and mark with new dateModified',
        why: 'Your content was last updated ' + Math.round(monthsOld) + ' months ago (over a year). For most topics, this is considered outdated. AI engines strongly favor recent content and may skip citing old information, especially if newer sources are available.',
        howToFix: 'Comprehensively update your content: replace old statistics with current data, add recent developments, update examples, verify all facts are still accurate, refresh outdated sections. Then update dateModified metadata to the current date. Consider adding "Last Updated: [Date]" visible to users.',
        priority: 'high'
      });
    }
  } else {
    recommendations.push({
      text: 'Add dateModified metadata to show content freshness',
      why: 'Your page has no dateModified or last updated metadata. AI engines cannot determine if your content is current or outdated. Without date information, AI engines may assume content is old and deprioritize it in favor of pages with clear freshness signals.',
      howToFix: 'Add dateModified metadata in multiple places: (1) <meta property="article:modified_time" content="2025-01-23"> in <head>, (2) JSON-LD schema with "dateModified" property, (3) visible "Last Updated: January 23, 2025" on the page. Update this date whenever you make significant content changes.',
      priority: 'medium'
    });
  }
  
  // 4. TRUSTWORTHINESS SIGNALS (25 points)
  // HTTPS
  const isHttps = url.startsWith('https://');
  findings.trustworthiness.details.isSecure = isHttps;
  
  if (isHttps) {
    findings.trustworthiness.score += 10;
  } else {
    recommendations.push({
      text: 'Use HTTPS for security and trust signals',
      why: 'Your site uses HTTP instead of HTTPS. This is a CRITICAL trust issue. AI engines and browsers flag HTTP sites as "Not Secure". HTTPS is a basic requirement for trustworthiness - without it, AI engines may refuse to cite your content entirely, especially for YMYL topics.',
      howToFix: 'Install an SSL/TLS certificate and enable HTTPS on your server. Most hosting providers offer free SSL certificates (Let\'s Encrypt). Configure 301 redirects from HTTP to HTTPS. Update all internal links to use https://. This is non-negotiable for credibility.',
      priority: 'critical'
    });
  }
  
  // Contact information
  const hasContactInfo = hasElement($, '[href^="mailto:"]') || 
                        mainContent.toLowerCase().includes('contact') ||
                        hasElement($, 'address');
  
  findings.trustworthiness.details.hasContactInfo = hasContactInfo;
  
  if (hasContactInfo) {
    findings.trustworthiness.score += 8;
  } else {
    recommendations.push({
      text: 'Add contact information to build trust with users and AI engines',
      why: 'Your page has no visible contact information (email, contact page, address). Contact information is a key trust signal - it shows there\'s a real person/organization behind the content who can be reached. AI engines factor contactability into trustworthiness assessments.',
      howToFix: 'Add contact information in multiple places: (1) email link in footer (mailto:), (2) dedicated Contact page linked in navigation, (3) physical address if applicable (use <address> element), (4) contact form. At minimum, provide an email address where users can reach you.',
      priority: 'high'
    });
  }
  
  // Privacy policy / terms
  const hasPrivacyLink = $('a[href*="privacy"], a[href*="terms"]').length > 0;
  findings.trustworthiness.details.hasPrivacyPolicy = hasPrivacyLink;
  
  if (hasPrivacyLink) {
    findings.trustworthiness.score += 7;
  } else {
    recommendations.push({
      text: 'Link to privacy policy and terms of service',
      why: 'Your site has no links to privacy policy or terms of service. These legal pages are trust signals that show you take user privacy seriously and operate transparently. For commercial sites especially, missing privacy/terms pages reduces trustworthiness significantly.',
      howToFix: 'Create or link to privacy policy and terms of service pages. At minimum: (1) Privacy Policy explaining data collection/usage, (2) Terms of Service outlining usage rules. Link to these from your footer on every page. For e-commerce sites, this is essential for trust and often legally required.',
      priority: 'medium'
    });
  }
  
  // Calculate total score
  const totalScore = findings.experience.score + findings.expertise.score + 
                    findings.authoritativeness.score + findings.trustworthiness.score;
  const grade = getGrade(totalScore);
  
  // Sort recommendations by priority and limit to top 10
  const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
  const sortedRecommendations = recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 10);
  
  return {
    score: totalScore,
    grade,
    findings,
    recommendations: sortedRecommendations,
    details: {
      maxScore: 100,
      breakdown: {
        experience: { score: findings.experience.score, max: 25 },
        expertise: { score: findings.expertise.score, max: 25 },
        authoritativeness: { score: findings.authoritativeness.score, max: 25 },
        trustworthiness: { score: findings.trustworthiness.score, max: 25 }
      }
    }
  };
}

module.exports = { analyzePageLevelEEAT };