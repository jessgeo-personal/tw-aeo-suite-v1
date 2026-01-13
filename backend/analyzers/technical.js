// ========================================
// RECOMMENDATION ENHANCEMENTS
// ========================================
const enhancements = {
  'No structured data': {
    context: 'Schema markup is crucial for AI engines to understand your content structure.',
    example: 'When HubSpot added structured data to their blog, they saw a 20% increase in AI-powered search visibility.',
    reference: 'Google reports that pages with schema markup rank 4 positions higher on average.'
  },
  'Missing content-specific schema': {
    context: 'FAQ and Article schemas are AI engines\' favorite content formats.',
    example: 'Moz added FAQ schema to their SEO guides and became the top-cited source in ChatGPT for "what is SEO".',
    reference: 'AI engines prioritize FAQ-structured content 3x more than unstructured text.'
  },
  'No H1 heading': {
    context: 'AI engines use H1 tags to understand your page\'s primary topic.',
    example: 'Buffer uses single, descriptive H1 tags on every post, making them highly citable.',
    reference: 'Pages with exactly one H1 tag are 2.5x more likely to be correctly interpreted by AI.'
  },
  'Multiple H1': {
    context: 'Multiple H1 tags confuse AI engines about your page\'s main topic.',
    example: 'When Shopify reduced multiple H1s to one per page, their AI citation rate improved 35%.',
    reference: 'Pages with a single H1 are ranked 40% higher in AI-generated responses.'
  },
  'Insufficient subheadings': {
    context: 'H2 headers create logical sections AI engines can extract independently.',
    example: 'Neil Patel structures guides with 5-7 H2 headers, each answering a specific sub-question.',
    reference: 'Content with 3+ H2 headers is 60% more likely to appear in AI-generated answers.'
  },
  'Low word count': {
    context: 'AI engines favor comprehensive content that thoroughly answers questions.',
    example: 'Ahrefs increased their minimum from 800 to 2,000 words and saw 3x more AI citations.',
    reference: 'The average AI-cited article contains 1,500+ words with comprehensive coverage.'
  },
  'Not using HTTPS': {
    context: 'AI engines prioritize secure, trustworthy sources.',
    example: 'After migrating to HTTPS, Backlinko saw immediate improvements in AI search rankings.',
    reference: 'HTTPS sites receive a direct ranking boost and are preferred by AI engines.'
  },
  'No canonical': {
    context: 'Without canonical tags, AI engines may split your authority across duplicate URLs.',
    example: 'Shopify saw 35% more AI citations after consolidating duplicates with canonicalization.',
    reference: 'Pages without canonical tags experience 50% lower citation rates due to authority dilution.'
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
 * TOOL 1: Technical AEO Audit
 * Analyzes whether AI engines can properly access and parse your website
 * Focuses on: Schema, crawlability, structure, accessibility
 */

const { extractSchemas, extractMeta, extractContent } = require('../utils');

function analyzeTechnical($, url) {
  const schemas = extractSchemas($);
  const meta = extractMeta($);
  const content = extractContent($);

  // ========================================
  // SCHEMA MARKUP ANALYSIS
  // ========================================
  const schemaAnalysis = analyzeSchemas(schemas);

  // ========================================
  // CRAWLABILITY ANALYSIS
  // ========================================
  const crawlability = analyzeCrawlability($, meta, url);

  // ========================================
  // HTML STRUCTURE ANALYSIS
  // ========================================
  const structure = analyzeStructure($, content);

  // ========================================
  // ACCESSIBILITY FOR AI
  // ========================================
  const accessibility = analyzeAccessibility($, content);

  // ========================================
  // CALCULATE SCORES
  // ========================================
  const scores = {
    schema: schemaAnalysis.score,
    crawlability: crawlability.score,
    structure: structure.score,
    accessibility: accessibility.score,
  };

  const overallScore = Math.round(
    (scores.schema * 0.30) +
    (scores.crawlability * 0.25) +
    (scores.structure * 0.25) +
    (scores.accessibility * 0.20)
  );

  // ========================================
  // GENERATE RECOMMENDATIONS
  // ========================================
  const recommendations = [
    ...schemaAnalysis.recommendations,
    ...crawlability.recommendations,
    ...structure.recommendations,
    ...accessibility.recommendations,
  ].sort((a, b) => {
    const priority = { critical: 0, high: 1, medium: 2, low: 3 };
    return priority[a.priority] - priority[b.priority];
  });

  return {
    overallScore,
    scores,
    schema: schemaAnalysis,
    crawlability,
    structure,
    accessibility,
    recommendations: recommendations.map(enhanceRecommendation),  // <-- Add .map()
    meta,
  };
}

function analyzeSchemas(schemas) {
  const { schemaTypes } = schemas;
  const recommendations = [];
  let score = 0;

  const hasSchema = schemas.schemas.length > 0;
  const hasFAQ = schemaTypes.some(t => t.toLowerCase().includes('faq'));
  const hasArticle = schemaTypes.some(t => ['Article', 'NewsArticle', 'BlogPosting', 'TechArticle', 'HowTo'].includes(t));
  const hasOrganization = schemaTypes.some(t => ['Organization', 'LocalBusiness', 'Corporation', 'Company'].includes(t));
  const hasProduct = schemaTypes.some(t => ['Product', 'Service', 'SoftwareApplication'].includes(t));
  const hasBreadcrumb = schemaTypes.some(t => t.includes('Breadcrumb'));
  const hasWebPage = schemaTypes.some(t => ['WebPage', 'WebSite', 'ItemPage'].includes(t));

  // Scoring
  if (hasSchema) score += 25;
  if (hasFAQ) score += 20;
  if (hasArticle) score += 15;
  if (hasOrganization) score += 15;
  if (hasProduct) score += 10;
  if (hasBreadcrumb) score += 8;
  if (hasWebPage) score += 7;
  score = Math.min(score, 100);

  // Recommendations
  if (!hasSchema) {
    recommendations.push({
      priority: 'critical',
      category: 'Schema',
      issue: 'No structured data (JSON-LD) found',
      action: 'Add JSON-LD schema markup to help AI engines understand your content',
      implementation: `Add this to your <head>:\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Your Page Title",\n  "description": "Your page description"\n}\n</script>`,
    });
  }

  if (!hasFAQ && !hasArticle) {
    recommendations.push({
      priority: 'high',
      category: 'Schema',
      issue: 'Missing content-specific schema (FAQ or Article)',
      action: 'Add FAQPage schema for Q&A content or Article schema for informational content',
      implementation: 'FAQPage schema significantly increases chances of AI citation. See schema.org/FAQPage',
    });
  }

  if (!hasOrganization) {
    recommendations.push({
      priority: 'medium',
      category: 'Schema',
      issue: 'Missing Organization schema',
      action: 'Add Organization schema to establish entity identity',
      implementation: 'Helps AI engines understand WHO you are, not just what your content says',
    });
  }

  if (!hasBreadcrumb) {
    recommendations.push({
      priority: 'low',
      category: 'Schema',
      issue: 'No BreadcrumbList schema',
      action: 'Add breadcrumb schema to show site hierarchy',
      implementation: 'Helps AI understand your site structure and content relationships',
    });
  }

  return {
    score,
    hasSchema,
    count: schemas.schemas.length,
    types: schemaTypes,
    detected: { hasFAQ, hasArticle, hasOrganization, hasProduct, hasBreadcrumb, hasWebPage },
    recommendations,
  };
}

function analyzeCrawlability($, meta, url) {
  const recommendations = [];
  let score = 0;

  // Check robots meta
  const robotsMeta = meta.robots.toLowerCase();
  const isIndexable = !robotsMeta.includes('noindex');
  const isFollowable = !robotsMeta.includes('nofollow');

  // Check for canonical
  const hasCanonical = !!meta.canonical;
  const canonicalMatchesUrl = meta.canonical === url || meta.canonical === url.replace(/\/$/, '');

  // Check for HTTPS
  const hasHTTPS = url.startsWith('https://');

  // Check for language declaration
  const hasLang = !!$('html').attr('lang');

  // Check for hreflang (international)
  const hasHreflang = $('link[hreflang]').length > 0;

  // Check for sitemap reference
  const hasSitemapLink = $('link[rel="sitemap"]').length > 0;

  // Scoring
  if (isIndexable) score += 30;
  if (isFollowable) score += 15;
  if (hasCanonical) score += 20;
  if (hasHTTPS) score += 20;
  if (hasLang) score += 10;
  if (hasHreflang) score += 5;
  score = Math.min(score, 100);

  // Recommendations
  if (!isIndexable) {
    recommendations.push({
      priority: 'critical',
      category: 'Crawlability',
      issue: 'Page is set to noindex - AI engines cannot index this page',
      action: 'Remove noindex directive if you want this page to appear in AI answers',
      implementation: 'Remove "noindex" from <meta name="robots"> tag',
    });
  }

  if (!hasHTTPS) {
    recommendations.push({
      priority: 'high',
      category: 'Crawlability',
      issue: 'Site not using HTTPS',
      action: 'Enable HTTPS for security and trust signals',
      implementation: 'AI engines prefer secure sources. Get an SSL certificate.',
    });
  }

  if (!hasCanonical) {
    recommendations.push({
      priority: 'medium',
      category: 'Crawlability',
      issue: 'No canonical URL specified',
      action: 'Add rel="canonical" to prevent duplicate content confusion',
      implementation: `<link rel="canonical" href="${url}" />`,
    });
  }

  if (!hasLang) {
    recommendations.push({
      priority: 'medium',
      category: 'Crawlability',
      issue: 'No language declaration',
      action: 'Add lang attribute to HTML tag',
      implementation: '<html lang="en"> helps AI engines understand content language',
    });
  }

  return {
    score,
    isIndexable,
    isFollowable,
    hasCanonical,
    canonical: meta.canonical,
    hasHTTPS,
    hasLang,
    lang: $('html').attr('lang') || null,
    hasHreflang,
    recommendations,
  };
}

function analyzeStructure($, content) {
  const recommendations = [];
  let score = 0;

  const h1Count = content.headers.h1.length;
  const h2Count = content.headers.h2.length;
  const h3Count = content.headers.h3.length;
  const totalHeaders = h1Count + h2Count + h3Count;

  // Check header hierarchy
  const hasProperH1 = h1Count === 1;
  const hasSubheadings = h2Count >= 2;
  const hasGoodHierarchy = hasProperH1 && hasSubheadings;

  // Content depth
  const hasSubstantialContent = content.wordCount >= 500;
  const hasComprehensiveContent = content.wordCount >= 1000;

  // Lists and structure
  const hasLists = content.lists.items >= 3;
  const hasTables = content.tables > 0;

  // Paragraph structure
  const hasGoodParagraphs = content.paragraphCount >= 5;

  // Scoring
  if (hasProperH1) score += 20;
  if (hasSubheadings) score += 15;
  if (h3Count >= 2) score += 10;
  if (hasSubstantialContent) score += 20;
  if (hasComprehensiveContent) score += 10;
  if (hasLists) score += 10;
  if (hasGoodParagraphs) score += 10;
  if (hasTables) score += 5;
  score = Math.min(score, 100);

  // Recommendations
  if (h1Count === 0) {
    recommendations.push({
      priority: 'critical',
      category: 'Structure',
      issue: 'No H1 heading found',
      action: 'Add a single, descriptive H1 heading that summarizes the page topic',
      implementation: 'AI engines use H1 as the primary topic identifier',
    });
  } else if (h1Count > 1) {
    recommendations.push({
      priority: 'high',
      category: 'Structure',
      issue: `Multiple H1 headings found (${h1Count})`,
      action: 'Use only one H1 per page, use H2 for subsections',
      implementation: 'Multiple H1s confuse content hierarchy for AI parsing',
    });
  }

  if (h2Count < 2) {
    recommendations.push({
      priority: 'high',
      category: 'Structure',
      issue: 'Insufficient subheadings (H2 tags)',
      action: 'Add H2 headings to break content into scannable sections',
      implementation: 'AI engines extract content by sections. 3-5 H2 headings is ideal.',
    });
  }

  if (content.wordCount < 300) {
    recommendations.push({
      priority: 'high',
      category: 'Structure',
      issue: `Thin content (${content.wordCount} words)`,
      action: 'Expand content to at least 500-800 words for comprehensive coverage',
      implementation: 'AI engines prefer thorough, authoritative content',
    });
  }

  if (!hasLists) {
    recommendations.push({
      priority: 'low',
      category: 'Structure',
      issue: 'No lists found in content',
      action: 'Add bullet points or numbered lists for key information',
      implementation: 'Lists are easily extractable by AI for direct answers',
    });
  }

  return {
    score,
    headers: {
      h1: { count: h1Count, items: content.headers.h1 },
      h2: { count: h2Count, items: content.headers.h2.slice(0, 10) },
      h3: { count: h3Count, items: content.headers.h3.slice(0, 10) },
      total: totalHeaders,
    },
    hasProperH1,
    hasGoodHierarchy,
    wordCount: content.wordCount,
    paragraphCount: content.paragraphCount,
    lists: content.lists,
    tables: content.tables,
    recommendations,
  };
}

function analyzeAccessibility($, content) {
  const recommendations = [];
  let score = 0;

  // Image accessibility
  const imageAltRatio = content.images.total > 0 
    ? Math.round((content.images.withAlt / content.images.total) * 100) 
    : 100;

  // Check for semantic HTML
  const hasMain = $('main').length > 0;
  const hasNav = $('nav').length > 0;
  const hasArticle = $('article').length > 0;
  const hasSection = $('section').length > 0;
  const hasAside = $('aside').length > 0;
  const semanticElements = [hasMain, hasNav, hasArticle, hasSection].filter(Boolean).length;

  // Check for ARIA landmarks
  const hasAriaLabels = $('[aria-label]').length > 0;
  const hasAriaDescribedby = $('[aria-describedby]').length > 0;

  // Check for skip links
  const hasSkipLink = $('a[href="#main"], a[href="#content"], .skip-link').length > 0;

  // Check for proper button/link usage
  const clickableNonLinks = $('[onclick]:not(a):not(button)').length;

  // Scoring
  if (imageAltRatio >= 90) score += 25;
  else if (imageAltRatio >= 70) score += 15;
  else if (imageAltRatio >= 50) score += 5;

  if (semanticElements >= 3) score += 25;
  else if (semanticElements >= 2) score += 15;
  else if (semanticElements >= 1) score += 5;

  if (hasMain) score += 15;
  if (hasArticle) score += 10;
  if (hasAriaLabels) score += 10;
  if (clickableNonLinks === 0) score += 10;
  score = Math.min(score, 100);

  // Recommendations
  if (imageAltRatio < 80) {
    recommendations.push({
      priority: 'medium',
      category: 'Accessibility',
      issue: `Only ${imageAltRatio}% of images have alt text`,
      action: 'Add descriptive alt text to all meaningful images',
      implementation: 'AI engines use alt text to understand image content for context',
    });
  }

  if (!hasMain) {
    recommendations.push({
      priority: 'medium',
      category: 'Accessibility',
      issue: 'No <main> element found',
      action: 'Wrap primary content in <main> tag',
      implementation: 'Semantic HTML helps AI identify the main content vs navigation/footer',
    });
  }

  if (!hasArticle && content.wordCount > 300) {
    recommendations.push({
      priority: 'low',
      category: 'Accessibility',
      issue: 'No <article> element for main content',
      action: 'Wrap article/blog content in <article> tag',
      implementation: 'Signals to AI that this is standalone, citable content',
    });
  }

  if (semanticElements < 2) {
    recommendations.push({
      priority: 'medium',
      category: 'Accessibility',
      issue: 'Limited use of semantic HTML elements',
      action: 'Use semantic elements: <main>, <article>, <section>, <nav>, <aside>',
      implementation: 'Semantic HTML provides clear content structure for AI parsing',
    });
  }

  return {
    score,
    images: {
      total: content.images.total,
      withAlt: content.images.withAlt,
      altRatio: imageAltRatio,
    },
    semanticHTML: {
      hasMain,
      hasNav,
      hasArticle,
      hasSection,
      hasAside,
      score: semanticElements,
    },
    aria: {
      hasLabels: hasAriaLabels,
      hasDescribedby: hasAriaDescribedby,
    },
    recommendations,
  };
}

module.exports = { analyzeTechnical };
