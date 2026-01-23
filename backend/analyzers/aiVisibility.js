const {
  getGrade,
  extractText,
  getAllText,
  getMetaContent,
  hasElement,
  countElements,
  hasSchemaType,
  findStructuredData,
  percentage
} = require('../utils/shared');

/**
 * Analyzer 5: AI Visibility Assessment
 * Evaluates citation potential and AI-friendliness
 */
async function analyzeAIVisibility($, url) {
  const findings = {
    citationPotential: { score: 0, details: {} },
    structuredAnswers: { score: 0, details: {} },
    aiAccessibility: { score: 0, details: {} }
  };
  
  const recommendations = [];
  const mainContent = $('article, main, body').first().text();
  
  // 1. CITATION POTENTIAL (35 points)
  // Clear, concise answer statements
  const sentences = mainContent.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  // Look for declarative statements that could be cited
  const citablePatterns = [
    /^[A-Z][^.!?]{20,150}[.!?]$/, // Concise statements (20-150 chars)
    /\b(is|are|means|refers to|defined as)\b/i,
    /\b\d+%\b/, // Statistics
    /according to|research shows|studies indicate/i
  ];
  
  let citableSentences = 0;
  sentences.forEach(sentence => {
    if (citablePatterns.some(pattern => pattern.test(sentence))) {
      citableSentences++;
    }
  });
  
  findings.citationPotential.details.citableSentences = citableSentences;
  findings.citationPotential.details.totalSentences = sentences.length;
  findings.citationPotential.details.citablePercentage = percentage(citableSentences, sentences.length);
  
  if (citableSentences >= 10) {
    findings.citationPotential.score += 15;
  } else if (citableSentences >= 5) {
    findings.citationPotential.score += 10;
    recommendations.push({
      text: 'Add more clear, concise statements that AI engines can easily cite',
      why: 'You have ' + citableSentences + ' citable sentences out of ' + sentences.length + ' total (' + Math.round(findings.citationPotential.details.citablePercentage) + '%). AI engines prefer content with 10+ short, fact-dense statements (20-150 characters) they can extract and cite directly.',
      howToFix: 'Add more concise declarative statements: "X is Y", "X means Y", "Research shows X". Break long sentences into shorter ones. Use definitive language. Include statistics and data points. Aim for 20-150 character statements that answer questions directly.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Structure content with short, fact-dense sentences for better AI citation',
      why: 'You only have ' + citableSentences + ' citable sentences (' + Math.round(findings.citationPotential.details.citablePercentage) + '% of total). AI engines need clear, concise statements to cite. Long, complex sentences are rarely extracted. Without bite-sized facts, citation likelihood drops dramatically.',
      howToFix: 'Restructure content into short, declarative statements: "X is Y", "X costs $Y", "Studies show X". Break paragraphs into individual facts. Use definitive language (is, means, equals). Include statistics. Target 10+ statements of 20-150 characters that directly answer common questions.',
      priority: 'critical'
    });
  }
  
  // Definitive statements with attributions
  const attributionPatterns = [
    /according to [A-Z][a-z]+ [A-Z][a-z]+/,
    /\b[A-Z][a-z]+ [A-Z][a-z]+ (said|stated|reported|found)\b/,
    /research by|study from|data from/i
  ];
  
  let attributedStatements = 0;
  attributionPatterns.forEach(pattern => {
    const matches = mainContent.match(pattern);
    if (matches) attributedStatements += matches.length;
  });
  
  findings.citationPotential.details.attributedStatements = attributedStatements;
  
  if (attributedStatements >= 3) {
    findings.citationPotential.score += 10;
  } else if (attributedStatements > 0) {
    findings.citationPotential.score += 5;
    recommendations.push({
      text: 'Add more attributed statements to authoritative sources',
      why: 'You have ' + attributedStatements + ' attributed statement(s). AI engines strongly favor content that cites credible sources (3+ attributions optimal). Attributed facts are considered more trustworthy and citation-worthy than unsupported claims.',
      howToFix: 'Add attributions to support key claims: "According to [Expert Name]", "Research by [Organization] shows", "[Source] reports that". Link to original sources. Cite specific studies, experts, or data sources. Aim for at least 3 attributed statements.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Include statements attributed to experts or research for credibility',
      why: 'Your content has no attributed statements. AI engines need to verify claims through citations to authoritative sources. Without attributions, content appears opinion-based rather than fact-based, severely reducing AI citation confidence.',
      howToFix: 'Add source attributions throughout: "According to [Expert]", "Research by [Organization] found", "[Authority] reports". Cite specific studies, data sources, or expert opinions. Include at least 3 attributed statements with links to original sources when possible.',
      priority: 'high'
    });
  }
  
  // Unique, original insights
  const insightPatterns = [
    /\bI found that\b/i,
    /\bour research shows\b/i,
    /\bin our experience\b/i,
    /\bwe discovered\b/i
  ];
  
  let originalInsights = 0;
  insightPatterns.forEach(pattern => {
    const matches = mainContent.match(pattern);
    if (matches) originalInsights += matches.length;
  });
  
  findings.citationPotential.details.originalInsights = originalInsights;
  
  if (originalInsights >= 2) {
    findings.citationPotential.score += 10;
  } else if (originalInsights > 0) {
    findings.citationPotential.score += 5;
    recommendations.push({
      text: 'Highlight more unique insights and original findings',
      why: 'You have ' + originalInsights + ' original insight(s). AI engines favor unique, first-hand findings (2+ optimal) over rehashed information. Original insights differentiate your content and increase citation value.',
      howToFix: 'Share more original discoveries: "I found that", "Our research shows", "We discovered", "In our testing". Include unique data, unexpected findings, novel approaches, or proprietary insights. Make your original contributions prominent.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Add original research or unique perspectives to stand out to AI engines',
      why: 'Your content lacks original insights. AI engines strongly prefer content with unique findings or perspectives over generic information available everywhere. Without original contributions, your content is less likely to be cited.',
      howToFix: 'Add original insights throughout: Share your testing results, unique observations, proprietary data, novel approaches, or unexpected findings. Use phrases like "I discovered", "Our research found", "In our analysis". Differentiate from existing content with unique value.',
      priority: 'high'
    });
  }
  
  // 2. STRUCTURED ANSWERS (35 points)
  // FAQ schema
  const hasFAQSchema = hasSchemaType($, 'FAQPage');
  findings.structuredAnswers.details.hasFAQSchema = hasFAQSchema;
  
  if (hasFAQSchema) {
    findings.structuredAnswers.score += 15;
  } else {
    recommendations.push({
      text: 'Add FAQPage schema to structure Q&A content for AI engines',
      why: 'FAQPage schema makes Q&A content explicitly machine-readable...',
      howToFix: 'Add FAQPage schema using JSON-LD...',
      priority: 'high'
    });
  }
  
  // HowTo schema
  const hasHowToSchema = hasSchemaType($, 'HowTo');
  findings.structuredAnswers.details.hasHowToSchema = hasHowToSchema;
  
  if (hasHowToSchema) {
    findings.structuredAnswers.score += 10;
  } else if (mainContent.toLowerCase().includes('how to')) {
    recommendations.push({text:'Add HowTo schema for step-by-step instructions',why:'HowTo schema structures instructional content for AI engines. Step-by-step content with HowTo schema is highly citable for how-to queries.',howToFix:'Add HowTo schema with step array. Each step should have name, text, and optional image. This makes instructions explicitly machine-readable.',priority:'medium'});
  }
  
  // Lists and tables for structured data
  const lists = countElements($, 'ul, ol');
  const tables = countElements($, 'table');
  findings.structuredAnswers.details.lists = lists;
  findings.structuredAnswers.details.tables = tables;
  
  if (lists >= 2 || tables >= 1) {
    findings.structuredAnswers.score += 10;
  } else if (lists > 0) {
    findings.structuredAnswers.score += 5;
    recommendations.push({text:'Add more lists or tables to structure information clearly',why:'You have some lists but AI engines excel at extracting data from well-structured lists and tables (5+ recommended). Tabular data is highly citable.',howToFix:'Convert key data into HTML tables or expanded lists. Use <table>, <ul>, <ol> tags. Structure comparisons, features, specifications, or data sets in tabular format.',priority:'medium'});
  } else {
    recommendations.push({text:'Use lists and tables to organize information for AI parsing',why:'Your content lacks structured lists or tables. AI engines strongly prefer data in tabular or list format for easy extraction and citation.',howToFix:'Add HTML lists (<ul>, <ol>) or tables (<table>) to organize information. Convert prose into structured data: feature lists, comparison tables, step lists, or data grids.',priority:'high'});
  }
  
  // 3. AI ACCESSIBILITY (30 points)
  // Clean HTML structure
  const hasMainTag = hasElement($, 'main');
  const hasArticleTag = hasElement($, 'article');
  findings.aiAccessibility.details.hasSemanticTags = hasMainTag || hasArticleTag;
  
  if (hasMainTag && hasArticleTag) {
    findings.aiAccessibility.score += 10;
  } else if (hasMainTag || hasArticleTag) {
    findings.aiAccessibility.score += 7;
    recommendations.push({text:'Use both <main> and <article> tags for better content identification',why:'Using semantic HTML (<main>, <article>) helps AI engines identify your main content area. Without these tags, AI may include navigation or sidebars in content extraction.',howToFix:'Wrap your main content in <main> tag and individual articles in <article> tags. This explicitly marks content boundaries for AI parsing.',priority:'medium'});
  } else {
    recommendations.push({text:'Add semantic HTML tags (<main>, <article>) for AI content extraction',why:'Your content lacks semantic HTML5 tags. AI engines rely on <main> and <article> tags to identify primary content. Without them, AI may extract incorrect content or miss your main points entirely.',howToFix:'Add <main> tag wrapping your primary content area. Use <article> for individual content pieces. This is CRITICAL for proper AI content extraction. Place these tags in your HTML structure immediately.',priority:'critical'});
  }
  
  // Mobile-friendly (viewport meta tag)
  const viewport = getMetaContent($, 'viewport');
  findings.aiAccessibility.details.isMobileFriendly = !!viewport;
  
  if (viewport) {
    findings.aiAccessibility.score += 5;
  } else {
    recommendations.push({text:'Add viewport meta tag for mobile-friendliness',why:'Viewport meta tag ensures mobile responsiveness. AI engines consider mobile-friendliness a quality signal. Missing viewport suggests outdated site.',howToFix:'Add to <head>: <meta name="viewport" content="width=device-width, initial-scale=1.0">',priority:'medium'});
  }
  
  // Proper heading hierarchy
  const h1Count = countElements($, 'h1');
  const h2Count = countElements($, 'h2');
  const h3Count = countElements($, 'h3');
  
  findings.aiAccessibility.details.headingHierarchy = {
    h1: h1Count,
    h2: h2Count,
    h3: h3Count
  };
  
  const hasProperHierarchy = h1Count === 1 && h2Count > 0;
  findings.aiAccessibility.details.hasProperHierarchy = hasProperHierarchy;
  
  if (hasProperHierarchy) {
    findings.aiAccessibility.score += 8;
  } else if (h1Count === 1) {
    findings.aiAccessibility.score += 4;
    recommendations.push({text:'Add H2 and H3 subheadings for better content structure',why:'Subheadings create scannable structure that AI engines use to understand content organization and extract relevant sections.',howToFix:'Add H2 tags for major sections and H3 for subsections. Use descriptive headings that include relevant keywords.',priority:'medium'});
  } else {
    recommendations.push({text:'Fix heading hierarchy - use exactly one H1 and multiple H2/H3 tags',why:'Improper heading hierarchy confuses AI engines about content structure. Multiple H1s or missing H2/H3s reduces parsing accuracy.',howToFix:'Use one H1 for page title, H2 for major sections, H3 for subsections. Create clear hierarchy: H1 > H2 > H3.',priority:'high'});
  }
  
  // Alt text for images
  const images = $('img');
  const imagesWithAlt = $('img[alt]');
  findings.aiAccessibility.details.imagesTotal = images.length;
  findings.aiAccessibility.details.imagesWithAlt = imagesWithAlt.length;
  
  if (images.length > 0) {
    const altCoverage = percentage(imagesWithAlt.length, images.length);
    findings.aiAccessibility.details.altTextCoverage = altCoverage;
    
    if (altCoverage >= 90) {
      findings.aiAccessibility.score += 7;
    } else if (altCoverage >= 50) {
      findings.aiAccessibility.score += 4;
      recommendations.push({text:'Add alt text to all images for better accessibility and AI understanding',why:'Some images lack alt text. Alt text helps AI engines understand image content and improves accessibility. Images without alt text are invisible to AI.',howToFix:'Add descriptive alt attributes to all <img> tags. Describe what the image shows, not just "image" or "photo". Be specific and relevant.',priority:'medium'});
    } else {
      recommendations.push({text:'Most images lack alt text - add descriptive alt attributes',why:'Most of your images have no alt text. This is critical for accessibility and AI understanding. Images without alt text provide zero information to AI engines.',howToFix:'Add alt="descriptive text" to every <img> tag. Describe image content specifically. Example: alt="Graph showing 40% increase in sales".',priority:'critical'});
    }
  } else {
    findings.aiAccessibility.score += 3; // Small bonus for no images vs missing alt text
  }
  
  // Calculate total score
  const totalScore = findings.citationPotential.score + findings.structuredAnswers.score + 
                    findings.aiAccessibility.score;
  const grade = getGrade(totalScore);
  
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
        citationPotential: { score: findings.citationPotential.score, max: 35 },
        structuredAnswers: { score: findings.structuredAnswers.score, max: 35 },
        aiAccessibility: { score: findings.aiAccessibility.score, max: 30 }
      }
    }
  };
}

module.exports = { analyzeAIVisibility };