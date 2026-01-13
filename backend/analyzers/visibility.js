// ========================================
// RECOMMENDATION ENHANCEMENTS
// ========================================
const enhancements = {
  'Improve freshness': {
    context: 'AI engines favor recently updated content.',
    example: 'The Verge started adding "Updated [Date]" and refreshing monthly - citations increased 40%.',
    reference: 'Content updated within 90 days is 2x more likely to be cited.'
  },
  'Increase authority': {
    context: 'AI engines cite sources that demonstrate deep expertise.',
    example: 'Healthline published 200+ interconnected health articles and became top medical source.',
    reference: 'Sites with 10+ related articles on a topic are 6x more likely to be cited as authorities.'
  },
  'Add author bylines': {
    context: 'AI engines trust content with identifiable, real authors.',
    example: 'After Forbes added detailed author bios, their citation rate increased 30%.',
    reference: 'Content with author bylines is perceived as 55% more trustworthy by AI.'
  }
};

function enhanceRecommendation(rec) {
  // Find matching enhancement
  const matchKey = Object.keys(enhancements).find(key => 
    rec.issue?.toLowerCase().includes(key.toLowerCase()) ||
    rec.action?.toLowerCase().includes(key.toLowerCase())
  );
  
  if (matchKey && enhancements[matchKey]) {
    return {
      ...rec,
      ...enhancements[matchKey]
    };
  }
  
  return rec;
}

/**
 * TOOL 4: AI Visibility Checker
 * Analyzes overall AI visibility and citation potential
 * Combines signals from all other tools + competitor comparison
 */

const { extractSchemas, extractMeta, extractContent, findQuestionContent, calculateReadability } = require('../utils');

function analyzeVisibility($, url) {
  const content = extractContent($);
  const meta = extractMeta($);
  const schemas = extractSchemas($);
  const questionContent = findQuestionContent($, content);
  const readability = calculateReadability(content.bodyText.substring(0, 5000));

  // ========================================
  // CITATION POTENTIAL SCORE
  // ========================================
  const citationPotential = analyzeCitationPotential($, content, meta, schemas);

  // ========================================
  // AI CRAWLABILITY
  // ========================================
  const aiCrawlability = analyzeAICrawlability($, meta, url);

  // ========================================
  // CONTENT EXTRACTABILITY
  // ========================================
  const extractability = analyzeExtractability($, content, questionContent);

  // ========================================
  // AUTHORITY SIGNALS
  // ========================================
  const authority = analyzeAuthority($, content, meta);

  // ========================================
  // FRESHNESS SIGNALS
  // ========================================
  const freshness = analyzeFreshness(meta);

  // ========================================
  // ENTITY RECOGNITION
  // ========================================
  const entities = analyzeEntities($, content, schemas);

  // ========================================
  // CALCULATE OVERALL VISIBILITY SCORE
  // ========================================
  const scores = {
    citationPotential: citationPotential.score,
    crawlability: aiCrawlability.score,
    extractability: extractability.score,
    authority: authority.score,
    freshness: freshness.score,
    entities: entities.score,
  };

  const overallScore = Math.round(
    (scores.citationPotential * 0.25) +
    (scores.crawlability * 0.15) +
    (scores.extractability * 0.25) +
    (scores.authority * 0.15) +
    (scores.freshness * 0.10) +
    (scores.entities * 0.10)
  );

  // ========================================
  // VISIBILITY VERDICT
  // ========================================
  const verdict = generateVerdict(overallScore, scores);

  // ========================================
  // RECOMMENDATIONS
  // ========================================
  const recommendations = [
    ...citationPotential.recommendations,
    ...aiCrawlability.recommendations,
    ...extractability.recommendations,
    ...authority.recommendations,
    ...freshness.recommendations,
    ...entities.recommendations,
  ].sort((a, b) => {
    const priority = { critical: 0, high: 1, medium: 2, low: 3 };
    return priority[a.priority] - priority[b.priority];
  });

  // ========================================
  // QUICK WINS
  // ========================================
  const quickWins = identifyQuickWins(scores, citationPotential, extractability, authority);

  return {
    overallScore,
    verdict,
    scores,
    citationPotential,
    aiCrawlability,
    extractability,
    authority,
    freshness,
    entities,
    recommendations: recommendations.map(enhanceRecommendation),  // <-- Add .map()
    quickWins,
    pageInfo: {
      title: meta.title,
      description: meta.description,
      url,
      wordCount: content.wordCount,
    },
  };
}

function analyzeCitationPotential($, content, meta, schemas) {
  const recommendations = [];
  let score = 0;

  // ========================================
  // QUOTABLE CONTENT
  // ========================================
  const sentences = content.bodyText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const quotableSentences = sentences.filter(s => {
    const words = s.trim().split(/\s+/).length;
    return words >= 10 && words <= 30; // Ideal quote length
  });
  
  const quotableRatio = sentences.length > 0 ? quotableSentences.length / sentences.length : 0;
  
  if (quotableRatio >= 0.3) score += 25;
  else if (quotableRatio >= 0.2) score += 15;
  else if (quotableRatio >= 0.1) score += 8;

  // ========================================
  // FACTUAL DENSITY
  // ========================================
  const numbers = (content.bodyText.match(/\b\d+(\.\d+)?(%|percent|million|billion|thousand)?\b/gi) || []).length;
  const factualDensity = content.wordCount > 0 ? (numbers / content.wordCount) * 100 : 0;
  
  if (factualDensity >= 2) score += 20;
  else if (factualDensity >= 1) score += 12;
  else if (factualDensity >= 0.5) score += 5;

  // ========================================
  // DIRECT ANSWER PATTERNS
  // ========================================
  const directAnswerPatterns = [
    /^(the answer is|yes,|no,|it is|there are)/im,
    /^(in short|simply put|to summarize)/im,
    /\. (This means|In other words|Specifically,)/g,
  ];
  
  let directAnswers = 0;
  directAnswerPatterns.forEach(pattern => {
    const matches = content.bodyText.match(pattern);
    if (matches) directAnswers += matches.length;
  });

  if (directAnswers >= 5) score += 15;
  else if (directAnswers >= 2) score += 10;

  // ========================================
  // SCHEMA BONUS
  // ========================================
  const hasFAQSchema = schemas.schemaTypes.some(t => t.toLowerCase().includes('faq'));
  const hasArticleSchema = schemas.schemaTypes.some(t => 
    ['Article', 'NewsArticle', 'BlogPosting', 'HowTo'].includes(t)
  );
  
  if (hasFAQSchema) score += 15;
  if (hasArticleSchema) score += 10;

  // ========================================
  // UNIQUE VALUE INDICATORS
  // ========================================
  const hasOriginalContent = /our (research|study|data|analysis|findings)|we (found|discovered|surveyed)/i.test(content.bodyText);
  const hasExclusive = /exclusive|proprietary|original|first-hand/i.test(content.bodyText);
  
  if (hasOriginalContent) score += 10;
  if (hasExclusive) score += 5;

  score = Math.min(score, 100);

  // Recommendations
  if (quotableRatio < 0.2) {
    recommendations.push({
      priority: 'high',
      category: 'Citation Potential',
      issue: 'Few quotable sentences',
      action: 'Add more concise, standalone sentences (15-25 words) that could be directly quoted',
    });
  }

  if (factualDensity < 1) {
    recommendations.push({
      priority: 'medium',
      category: 'Citation Potential',
      issue: 'Low factual density',
      action: 'Add more specific numbers, statistics, and data points',
    });
  }

  if (!hasFAQSchema && !hasArticleSchema) {
    recommendations.push({
      priority: 'high',
      category: 'Citation Potential',
      issue: 'No content-specific schema markup',
      action: 'Add FAQPage or Article schema to increase citation chances',
    });
  }

  return {
    score,
    quotableSentences: {
      count: quotableSentences.length,
      ratio: Math.round(quotableRatio * 100),
      examples: quotableSentences.slice(0, 3).map(s => s.trim().substring(0, 100) + '...'),
    },
    factualDensity: Math.round(factualDensity * 100) / 100,
    directAnswers,
    hasOriginalContent,
    recommendations,
  };
}

function analyzeAICrawlability($, meta, url) {
  const recommendations = [];
  let score = 0;

  // Robots meta
  const robotsMeta = meta.robots.toLowerCase();
  const isIndexable = !robotsMeta.includes('noindex');
  const isFollowable = !robotsMeta.includes('nofollow');

  if (isIndexable) score += 35;
  if (isFollowable) score += 15;

  // HTTPS
  const hasHTTPS = url.startsWith('https://');
  if (hasHTTPS) score += 20;

  // Canonical
  const hasCanonical = !!meta.canonical;
  if (hasCanonical) score += 15;

  // Language
  const hasLang = !!$('html').attr('lang');
  if (hasLang) score += 10;

  // Check for bot-blocking signals
  const hasCaptcha = $('[class*="captcha"], [id*="captcha"], [class*="recaptcha"]').length > 0;
  const hasLoginWall = $('[class*="login-wall"], [class*="paywall"], [id*="paywall"]').length > 0;
  
  if (!hasCaptcha) score += 3;
  if (!hasLoginWall) score += 2;

  score = Math.min(score, 100);

  // Recommendations
  if (!isIndexable) {
    recommendations.push({
      priority: 'critical',
      category: 'AI Crawlability',
      issue: 'Page is set to noindex - AI engines cannot access this',
      action: 'Remove noindex if you want AI visibility',
    });
  }

  if (!hasHTTPS) {
    recommendations.push({
      priority: 'high',
      category: 'AI Crawlability',
      issue: 'Not using HTTPS',
      action: 'Enable HTTPS for trust signals',
    });
  }

  if (hasCaptcha) {
    recommendations.push({
      priority: 'medium',
      category: 'AI Crawlability',
      issue: 'CAPTCHA detected - may block AI crawlers',
      action: 'Consider allowing known AI bot user agents',
    });
  }

  return {
    score,
    isIndexable,
    isFollowable,
    hasHTTPS,
    hasCanonical,
    hasLang,
    hasCaptcha,
    hasLoginWall,
    recommendations,
  };
}

function analyzeExtractability($, content, questionContent) {
  const recommendations = [];
  let score = 0;

  // ========================================
  // HEADER STRUCTURE
  // ========================================
  const h1Count = content.headers.h1.length;
  const h2Count = content.headers.h2.length;
  const h3Count = content.headers.h3.length;
  
  if (h1Count === 1) score += 15;
  if (h2Count >= 3 && h2Count <= 10) score += 15;
  if (h3Count >= 2) score += 5;

  // ========================================
  // QUESTION-STYLE HEADERS
  // ========================================
  const questionHeaders = questionContent.questionHeaders;
  if (questionHeaders.length >= 5) score += 20;
  else if (questionHeaders.length >= 3) score += 12;
  else if (questionHeaders.length >= 1) score += 5;

  // ========================================
  // LIST CONTENT
  // ========================================
  if (content.lists.items >= 10) score += 15;
  else if (content.lists.items >= 5) score += 10;
  else if (content.lists.items >= 3) score += 5;

  // ========================================
  // SEMANTIC HTML
  // ========================================
  const hasMain = $('main').length > 0;
  const hasArticle = $('article').length > 0;
  const hasSection = $('section').length > 0;
  
  if (hasMain) score += 8;
  if (hasArticle) score += 8;
  if (hasSection && $('section').length <= 10) score += 4;

  // ========================================
  // CONTENT CHUNKING
  // ========================================
  const avgParagraphLength = content.paragraphCount > 0 
    ? content.wordCount / content.paragraphCount 
    : 0;
  
  // Ideal: 50-150 words per paragraph
  if (avgParagraphLength >= 40 && avgParagraphLength <= 150) score += 10;
  else if (avgParagraphLength >= 30 && avgParagraphLength <= 200) score += 5;

  score = Math.min(score, 100);

  // Recommendations
  if (questionHeaders.length < 3) {
    recommendations.push({
      priority: 'high',
      category: 'Extractability',
      issue: `Only ${questionHeaders.length} question-style headers`,
      action: 'Add headers starting with What, How, Why, etc.',
    });
  }

  if (content.lists.items < 3) {
    recommendations.push({
      priority: 'medium',
      category: 'Extractability',
      issue: 'Limited list content',
      action: 'Add bullet points or numbered lists for key information',
    });
  }

  if (!hasMain && !hasArticle) {
    recommendations.push({
      priority: 'medium',
      category: 'Extractability',
      issue: 'No semantic content containers',
      action: 'Wrap main content in <main> or <article> tags',
    });
  }

  return {
    score,
    headers: {
      h1: h1Count,
      h2: h2Count,
      h3: h3Count,
      questionStyle: questionHeaders.length,
    },
    lists: content.lists,
    semanticHTML: { hasMain, hasArticle, hasSection },
    avgParagraphLength: Math.round(avgParagraphLength),
    recommendations,
  };
}

function analyzeAuthority($, content, meta) {
  const recommendations = [];
  let score = 0;

  // ========================================
  // AUTHORSHIP
  // ========================================
  const hasAuthor = !!meta.author;
  const hasAuthorBio = $('[class*="author"], [class*="bio"], [rel="author"]').length > 0;
  
  if (hasAuthor) score += 15;
  if (hasAuthorBio) score += 10;

  // ========================================
  // SOURCE CITATIONS
  // ========================================
  const sourcePatterns = [
    /according to/gi,
    /research (shows|indicates|found)/gi,
    /study (by|from|published)/gi,
    /\[\d+\]/g,
  ];
  
  let sourceCount = 0;
  sourcePatterns.forEach(pattern => {
    const matches = content.bodyText.match(pattern);
    if (matches) sourceCount += matches.length;
  });
  
  // External links as sources
  const externalLinks = content.links.external;
  const effectiveSources = sourceCount + Math.floor(externalLinks / 2);
  
  if (effectiveSources >= 5) score += 20;
  else if (effectiveSources >= 2) score += 12;
  else if (effectiveSources >= 1) score += 5;

  // ========================================
  // EXPERT LANGUAGE
  // ========================================
  const expertTerms = /\b(research|study|analysis|data|evidence|methodology|framework)\b/gi;
  const expertMatches = content.bodyText.match(expertTerms) || [];
  
  if (expertMatches.length >= 10) score += 15;
  else if (expertMatches.length >= 5) score += 10;
  else if (expertMatches.length >= 2) score += 5;

  // ========================================
  // CONTENT DEPTH
  // ========================================
  if (content.wordCount >= 1500) score += 20;
  else if (content.wordCount >= 1000) score += 15;
  else if (content.wordCount >= 600) score += 10;
  else if (content.wordCount >= 400) score += 5;

  // ========================================
  // ORGANIZATION SIGNALS
  // ========================================
  const hasAboutLink = $('a[href*="about"]').length > 0;
  const hasContactLink = $('a[href*="contact"]').length > 0;
  
  if (hasAboutLink) score += 5;
  if (hasContactLink) score += 5;

  score = Math.min(score, 100);

  // Recommendations
  if (!hasAuthor) {
    recommendations.push({
      priority: 'medium',
      category: 'Authority',
      issue: 'No author attribution',
      action: 'Add author name and credentials',
    });
  }

  if (effectiveSources < 2) {
    recommendations.push({
      priority: 'medium',
      category: 'Authority',
      issue: 'Few source citations',
      action: 'Reference external sources, studies, or data',
    });
  }

  if (content.wordCount < 600) {
    recommendations.push({
      priority: 'high',
      category: 'Authority',
      issue: `Thin content (${content.wordCount} words)`,
      action: 'Expand to 800+ words for comprehensive coverage',
    });
  }

  return {
    score,
    authorship: { hasAuthor, author: meta.author, hasAuthorBio },
    sources: { count: effectiveSources, externalLinks },
    expertTerms: expertMatches.length,
    contentDepth: content.wordCount,
    recommendations,
  };
}

function analyzeFreshness(meta) {
  const recommendations = [];
  let score = 0;

  const hasPublishDate = !!meta.publishedTime;
  const hasModifiedDate = !!meta.modifiedTime;
  
  if (hasPublishDate) score += 30;
  if (hasModifiedDate) score += 30;

  // Check date recency
  if (hasModifiedDate || hasPublishDate) {
    const dateStr = meta.modifiedTime || meta.publishedTime;
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const daysSince = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (daysSince <= 30) score += 30;
      else if (daysSince <= 90) score += 20;
      else if (daysSince <= 180) score += 10;
      else if (daysSince <= 365) score += 5;
    } catch (e) {
      // Can't parse date
    }
  }

  // Check for date visibility
  const hasVisibleDate = meta.publishedTime || meta.modifiedTime;
  if (hasVisibleDate) score += 10;

  score = Math.min(score, 100);

  // Recommendations
  if (!hasPublishDate) {
    recommendations.push({
      priority: 'medium',
      category: 'Freshness',
      issue: 'No publish date found',
      action: 'Add article:published_time meta tag',
    });
  }

  if (!hasModifiedDate) {
    recommendations.push({
      priority: 'low',
      category: 'Freshness',
      issue: 'No modified date found',
      action: 'Add article:modified_time meta tag when updating content',
    });
  }

  return {
    score,
    publishDate: meta.publishedTime || null,
    modifiedDate: meta.modifiedTime || null,
    hasVisibleDate: hasPublishDate || hasModifiedDate,
    recommendations,
  };
}

function analyzeEntities($, content, schemas) {
  const recommendations = [];
  let score = 0;

  // ========================================
  // ORGANIZATION SCHEMA
  // ========================================
  const hasOrgSchema = schemas.schemaTypes.some(t => 
    ['Organization', 'LocalBusiness', 'Corporation', 'Company'].includes(t)
  );
  
  if (hasOrgSchema) score += 30;

  // ========================================
  // PERSON SCHEMA
  // ========================================
  const hasPersonSchema = schemas.schemaTypes.some(t => t === 'Person');
  if (hasPersonSchema) score += 15;

  // ========================================
  // PRODUCT/SERVICE SCHEMA
  // ========================================
  const hasProductSchema = schemas.schemaTypes.some(t => 
    ['Product', 'Service', 'SoftwareApplication', 'Offer'].includes(t)
  );
  if (hasProductSchema) score += 20;

  // ========================================
  // ENTITY MENTIONS IN CONTENT
  // ========================================
  // Look for proper nouns (simplified)
  const properNouns = content.bodyText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  const uniqueEntities = [...new Set(properNouns)].length;
  
  if (uniqueEntities >= 20) score += 20;
  else if (uniqueEntities >= 10) score += 12;
  else if (uniqueEntities >= 5) score += 5;

  // ========================================
  // ABOUT PAGE LINK
  // ========================================
  const hasAboutLink = $('a[href*="about"]').length > 0;
  if (hasAboutLink) score += 10;

  // ========================================
  // SOCIAL PROFILES
  // ========================================
  const hasSocialLinks = $('a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="facebook.com"]').length > 0;
  if (hasSocialLinks) score += 5;

  score = Math.min(score, 100);

  // Recommendations
  if (!hasOrgSchema) {
    recommendations.push({
      priority: 'medium',
      category: 'Entities',
      issue: 'No Organization schema',
      action: 'Add Organization schema to establish entity identity',
    });
  }

  if (schemas.schemaTypes.length === 0) {
    recommendations.push({
      priority: 'high',
      category: 'Entities',
      issue: 'No schema markup for entity recognition',
      action: 'Add structured data to help AI understand what/who the content is about',
    });
  }

  return {
    score,
    schemas: {
      hasOrganization: hasOrgSchema,
      hasPerson: hasPersonSchema,
      hasProduct: hasProductSchema,
      types: schemas.schemaTypes,
    },
    entityMentions: uniqueEntities,
    hasAboutLink,
    hasSocialLinks,
    recommendations,
  };
}

function generateVerdict(overallScore, scores) {
  let level, description, color;

  if (overallScore >= 80) {
    level = 'Excellent';
    color = 'green';
    description = 'Your page is well-optimized for AI visibility. High likelihood of being cited.';
  } else if (overallScore >= 65) {
    level = 'Good';
    color = 'lightgreen';
    description = 'Solid foundation for AI visibility. Some improvements would increase citation chances.';
  } else if (overallScore >= 50) {
    level = 'Moderate';
    color = 'yellow';
    description = 'Average AI visibility. Several areas need improvement to compete effectively.';
  } else if (overallScore >= 35) {
    level = 'Below Average';
    color = 'orange';
    description = 'Limited AI visibility. Significant improvements needed across multiple areas.';
  } else {
    level = 'Poor';
    color = 'red';
    description = 'Very low AI visibility. Major restructuring recommended.';
  }

  // Identify weakest areas
  const scoreEntries = Object.entries(scores);
  const weakest = scoreEntries.sort((a, b) => a[1] - b[1]).slice(0, 2);

  return {
    level,
    color,
    description,
    weakestAreas: weakest.map(([name, score]) => ({ name, score })),
  };
}

function identifyQuickWins(scores, citationPotential, extractability, authority) {
  const quickWins = [];

  // Quick wins are high-impact, low-effort improvements
  if (scores.citationPotential < 60 && citationPotential.factualDensity < 1) {
    quickWins.push({
      effort: 'Low',
      impact: 'High',
      action: 'Add 3-5 specific statistics or data points to your content',
      reason: 'Numbers and facts are highly citable',
    });
  }

  if (extractability.headers.questionStyle < 3) {
    quickWins.push({
      effort: 'Low',
      impact: 'High',
      action: 'Convert 3-5 headers to question format (What is X?, How does Y work?)',
      reason: 'Question headers match how users query AI engines',
    });
  }

  if (scores.authority < 50 && !authority.authorship.hasAuthor) {
    quickWins.push({
      effort: 'Low',
      impact: 'Medium',
      action: 'Add author name in meta tags and visible byline',
      reason: 'Attributed content ranks higher in AI citations',
    });
  }

  if (extractability.lists.items < 5) {
    quickWins.push({
      effort: 'Low',
      impact: 'Medium',
      action: 'Add a bulleted list summarizing key points',
      reason: 'Lists are easily extractable for AI responses',
    });
  }

  if (scores.extractability < 60 && !extractability.semanticHTML.hasMain) {
    quickWins.push({
      effort: 'Low',
      impact: 'Medium',
      action: 'Wrap main content in <main> or <article> tags',
      reason: 'Helps AI identify the core content to cite',
    });
  }

  return quickWins.slice(0, 5);
}

module.exports = { analyzeVisibility };
