const {
  getGrade,
  extractText,
  getMetaContent,
  hasElement,
  countElements,
  getAttribute,
  findStructuredData,
  hasSchemaType,
  percentage
} = require('../utils/shared');

/**
 * Analyzer 1: Technical Foundation
 * Evaluates schema markup, crawlability, HTML structure
 */
async function analyzeTechnicalFoundation($, url) {
  const findings = {
    schemaMarkup: { score: 0, details: {} },
    crawlability: { score: 0, details: {} },
    htmlStructure: { score: 0, details: {} }
  };
  
  const recommendations = [];
  
  // 1. SCHEMA MARKUP ANALYSIS (40 points)
  const structuredData = findStructuredData($);
  findings.schemaMarkup.details.hasStructuredData = structuredData.length > 0;
  findings.schemaMarkup.details.count = structuredData.length;
  findings.schemaMarkup.details.types = [];
  
  if (structuredData.length > 0) {
    findings.schemaMarkup.score += 20; // Has structured data
    
    structuredData.forEach(data => {
      if (data['@type']) findings.schemaMarkup.details.types.push(data['@type']);
      if (data['@graph']) {
        data['@graph'].forEach(item => {
          if (item['@type']) findings.schemaMarkup.details.types.push(item['@type']);
        });
      }
    });
    
    // Check for high-value schema types
    const valuableTypes = ['Article', 'NewsArticle', 'BlogPosting', 'Product', 'Organization', 'Person', 'FAQPage', 'HowTo'];
    const hasValuableType = findings.schemaMarkup.details.types.some(type => valuableTypes.includes(type));
    
    if (hasValuableType) {
      findings.schemaMarkup.score += 15;
    } else {
      recommendations.push({
        text: 'Add high-value schema types like Article, Product, FAQPage, or HowTo',
        why: 'High-value schema types provide explicit, structured information that AI engines can easily extract and cite. Pages with proper schema are significantly more likely to be cited because the AI doesn\'t have to interpret your content - you\'ve told it exactly what everything is.',
        howToFix: 'Add JSON-LD schema markup to your <head> section. For blog posts use Article schema, for products use Product schema, for Q&A content use FAQPage schema, and for instructional content use HowTo schema. Use schema.org documentation for proper implementation.',
        priority: 'high'
      });
    }
    
    // Check for author/organization markup
    const hasAuthor = hasSchemaType($, 'Person') || hasSchemaType($, 'Organization');
    if (hasAuthor) {
      findings.schemaMarkup.score += 5;
    } else {
      recommendations.push({
        text: 'Add Person or Organization schema to establish authorship',
        why: 'Author schema establishes content ownership and credibility. AI engines use this information to assess expertise and trustworthiness, which are critical E-E-A-T signals for citation decisions.',
        howToFix: 'Add Person schema with author.url in your JSON-LD markup. Include properties like name, url, and jobTitle. For organizational content, use Organization schema with name, url, and logo properties.',
        priority: 'medium'
      });
    }
  } else {
    recommendations.push({
      text: 'Add structured data (JSON-LD) to help AI engines understand your content',
      why: 'Schema markup is the foundation of AI optimization. Without it, AI engines must guess what your content means. This is the #1 factor preventing pages from appearing in AI search results. Pages with proper schema are exponentially more likely to be cited.',
      howToFix: 'Add a <script type="application/ld+json"> tag in your <head> section with appropriate schema types from schema.org. Start with Article or Product type depending on your content, and include @context, @type, headline, author, and datePublished properties at minimum.',
      priority: 'critical'
    });
  }
  
  // 2. CRAWLABILITY ANALYSIS (30 points)
  // Meta robots
  const metaRobots = getMetaContent($, 'robots');
  findings.crawlability.details.metaRobots = metaRobots || 'Not specified';
  findings.crawlability.details.isIndexable = !metaRobots.toLowerCase().includes('noindex');
  
  if (findings.crawlability.details.isIndexable) {
    findings.crawlability.score += 15;
  } else {
    recommendations.push({
      text: 'Remove "noindex" directive to allow AI engines to index this page',
      why: 'If your page has a "noindex" directive, AI engines won\'t include it in their knowledge base at all. This is the #1 reason pages don\'t appear in AI search results. Without indexing permission, no other optimizations matter.',
      howToFix: 'Remove the <meta name="robots" content="noindex"> tag from your page <head>. If you need to block specific pages, use robots.txt instead of meta tags. For production pages you want cited, ensure there are no noindex directives anywhere.',
      priority: 'critical'
    });
  }
  
  // Canonical URL
  const canonical = getAttribute($, 'link[rel="canonical"]', 'href');
  findings.crawlability.details.hasCanonical = canonical || '';
  findings.crawlability.details.canonicalUrl = canonical;
  
  if (canonical) {
    findings.crawlability.score += 10;
  } else {
    recommendations.push({
      text: 'Add canonical URL to prevent duplicate content issues',
      why: 'Canonical URLs prevent duplicate content confusion. When AI engines find the same content at multiple URLs, they don\'t know which version to cite. A canonical tag tells them explicitly which version is authoritative.',
      howToFix: 'Add <link rel="canonical" href="https://yourdomain.com/this-page-url"> to your <head> section. The href should point to the preferred version of this exact page. Make sure it\'s an absolute URL (includes https://).',
      priority: 'high'
    });
  }
  
  // Internal links
  const internalLinks = $('a[href^="/"], a[href^="' + url + '"]').length;
  findings.crawlability.details.internalLinks = internalLinks;
  
  if (internalLinks > 0) {
    findings.crawlability.score += 5;
  } else {
    recommendations.push({
      text: 'Add internal links to improve site structure and crawlability',
      why: 'Internal links help AI engines discover related content and understand your site\'s information architecture. They provide context signals about topic relationships and content hierarchy.',
      howToFix: 'Add 3-5 contextual internal links to related pages on your site. Link to relevant articles, category pages, or supporting content. Use descriptive anchor text that indicates what the linked page is about.',
      priority: 'medium'
    });
  }
  
  // 3. HTML STRUCTURE ANALYSIS (30 points)
  // Title tag
  const title = extractText($, 'title');
  findings.htmlStructure.details.title = title;
  findings.htmlStructure.details.titleLength = title.length;
  
  if (title && title.length >= 30 && title.length <= 60) {
    findings.htmlStructure.score += 10;
  } else if (title) {
    findings.htmlStructure.score += 5;
    recommendations.push({
      text: 'Optimize title tag length (30-60 characters optimal for AI summaries)',
      why: 'AI engines use title tags as the primary topic indicator and often include them in citations. Optimal length ensures your full title appears in AI summaries without being cut off. Too short lacks context; too long gets truncated.',
      howToFix: 'Edit your <title> tag to be between 30-60 characters. Include your primary keyword and make it descriptive of the page content. Current length: ' + title.length + ' characters. Example: "Complete Guide to [Topic] - [Brand]".',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Add a descriptive title tag',
      why: 'The title tag is the single most important on-page element for AI understanding. It\'s the first thing AI engines read to determine your page topic. Without a title, AI engines have no clear topic signal and won\'t know what your page is about.',
      howToFix: 'Add a <title> tag inside your <head> section. Make it 30-60 characters, descriptive, and include your main keyword. Format: "[Primary Topic] - [Secondary Context] | [Brand]". This is the minimum requirement for AI visibility.',
      priority: 'critical'
    });
  }
  
  // Meta description
  const description = getMetaContent($, 'description');
  findings.htmlStructure.details.metaDescription = description;
  findings.htmlStructure.details.descriptionLength = description.length;
  
  if (description && description.length >= 120 && description.length <= 160) {
    findings.htmlStructure.score += 10;
  } else if (description) {
    findings.htmlStructure.score += 5;
    recommendations.push({
      text: 'Optimize meta description length (120-160 characters for better AI summaries)',
      why: 'Meta descriptions provide context that AI engines use when deciding if your content answers a query. Optimal length ensures complete context is captured. Too short lacks detail; too long gets truncated, losing important context.',
      howToFix: 'Edit your <meta name="description" content="..."> tag to be 120-160 characters. Include your main keyword and summarize what users will learn. Current length: ' + description.length + ' characters.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Add meta description to provide context for AI engines',
      why: 'Meta descriptions give AI engines a concise summary of your page content. While not as critical as the title, they provide valuable context that helps AI engines determine relevance and decide whether to cite your content.',
      howToFix: 'Add <meta name="description" content="Your description here"> to your <head> section. Write 120-160 characters describing what the page covers. Include your main keyword naturally.',
      priority: 'high'
    });
  }
  
  // Heading structure
  const h1Count = countElements($, 'h1');
  const h2Count = countElements($, 'h2');
  findings.htmlStructure.details.headings = { h1: h1Count, h2: h2Count };
  
  if (h1Count === 1 && h2Count > 0) {
    findings.htmlStructure.score += 10;
  } else if (h1Count === 1) {
    findings.htmlStructure.score += 5;
    recommendations.push({
      text: 'Add H2 subheadings to improve content structure and scanability',
      why: 'H2 subheadings create a clear content outline that AI engines use to understand your page organization. They make content scannable and help AI engines quickly identify relevant sections to cite. Good structure improves comprehension.',
      howToFix: 'Break your content into logical sections using <h2> tags. Use 3-5 H2 headings that describe major topic areas. Make them descriptive and include relevant keywords naturally. Example: "Why [Topic] Matters", "How to [Action]", "Benefits of [Topic]".',
      priority: 'medium'
    });
  } else if (h1Count > 1) {
    findings.htmlStructure.score += 3;
    recommendations.push({
      text: 'Use only one H1 tag per page for better semantic structure',
      why: 'Multiple H1 tags confuse AI engines about your main topic. H1 should clearly indicate the single primary topic. Multiple H1s suggest either poor structure or multiple competing topics, reducing AI confidence in citing your content.',
      howToFix: 'Identify your main page topic and use one <h1> tag for it. Convert other H1 tags to H2 or H3 depending on their hierarchical importance. Structure: H1 (main topic) → H2 (major sections) → H3 (subsections).',
      priority: 'high'
    });
  } else {
    recommendations.push({
      text: 'Add an H1 heading to establish page topic',
      why: 'The H1 heading is the semantic indicator of your page\'s main topic. AI engines rely heavily on H1 to understand what your page is about. Without an H1, there\'s no clear topic signal, significantly reducing citation likelihood.',
      howToFix: 'Add an <h1> tag at the top of your main content. Make it descriptive, 20-70 characters, and include your primary keyword. The H1 should clearly state the main topic or question your page addresses.',
      priority: 'critical'
    });
  }
  
  // Calculate total score
  const totalScore = findings.schemaMarkup.score + findings.crawlability.score + findings.htmlStructure.score;
  const grade = getGrade(totalScore);
  
  // Build detailed recommendations
  const detailedRecommendations = buildRecommendations(findings, recommendations);
  
  return {
    score: totalScore,
    grade,
    findings,
    recommendations: detailedRecommendations,
    details: {
      maxScore: 100,
      breakdown: {
        schemaMarkup: { score: findings.schemaMarkup.score, max: 40 },
        crawlability: { score: findings.crawlability.score, max: 30 },
        htmlStructure: { score: findings.htmlStructure.score, max: 30 }
      }
    }
  };
}

function buildRecommendations(findings, recommendations) {
  // Sort by priority: critical > high > medium > low
  const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
  const sorted = recommendations.sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Limit to top 10 recommendations
  return sorted.slice(0, 10);
}

module.exports = { analyzeTechnicalFoundation };