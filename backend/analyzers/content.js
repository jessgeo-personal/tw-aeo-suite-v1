// ========================================
// RECOMMENDATION ENHANCEMENTS
// ========================================
const enhancements = {
 'Low readability': {
    context: 'AI engines extract and cite content that\'s clear and easy to understand.',
    example: 'Shopify rewrote help docs to 9th-grade reading level and became top-cited ecommerce resource.',
    reference: 'Content with Flesch scores above 60 is 45% more likely to be cited than complex writing.'
  },
  'No question-style headers': {
    context: 'Question headers directly match how users ask AI engines for information.',
    example: 'When Zapier added "How do I..." headers to tutorials, AI citations jumped 70%.',
    reference: 'Pages with 3+ question headers are the top choice for AI-generated answers.'
  },
  'Missing FAQ': {
    context: 'FAQ sections are AI engines\' favorite content format.',
    example: 'REI added FAQ sections to product pages and became most-cited outdoor gear brand.',
    reference: 'Adding an FAQ section can increase AI citation rate by up to 85%.'
  },
  'Low quotable': {
    context: 'AI engines look for complete, self-contained statements they can directly quote.',
    example: 'Harvard Business Review structures articles with quotable insights, making them most-cited.',
    reference: 'Articles averaging 8+ quotable sentences per 500 words see 3x higher citations.'
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
 * TOOL 2: Content Quality Analyzer
 * Analyzes whether content is optimized for AI extraction and citation
 * Focuses on: Readability, Q&A patterns, citation-worthiness, structure
 */

const { extractContent, findQuestionContent, calculateReadability, extractMeta } = require('../utils');

function analyzeContent($, url) {
  const content = extractContent($);
  const meta = extractMeta($);
  const questionContent = findQuestionContent($, content);

  // ========================================
  // READABILITY ANALYSIS
  // ========================================
  const readability = analyzeReadability(content);

  // ========================================
  // Q&A PATTERN ANALYSIS
  // ========================================
  const qaPatterns = analyzeQAPatterns($, content, questionContent);

  // ========================================
  // CITATION-WORTHINESS ANALYSIS
  // ========================================
  const citationWorthiness = analyzeCitationWorthiness($, content, meta);

  // ========================================
  // CONTENT STRUCTURE FOR AI
  // ========================================
  const aiStructure = analyzeAIStructure($, content);

  // ========================================
  // CALCULATE SCORES
  // ========================================
  const scores = {
    readability: readability.score,
    qaPatterns: qaPatterns.score,
    citationWorthiness: citationWorthiness.score,
    aiStructure: aiStructure.score,
  };

  const overallScore = Math.round(
    (scores.readability * 0.20) +
    (scores.qaPatterns * 0.30) +
    (scores.citationWorthiness * 0.30) +
    (scores.aiStructure * 0.20)
  );

  // ========================================
  // GENERATE RECOMMENDATIONS
  // ========================================
  const recommendations = [
    ...readability.recommendations,
    ...qaPatterns.recommendations,
    ...citationWorthiness.recommendations,
    ...aiStructure.recommendations,
  ].sort((a, b) => {
    const priority = { critical: 0, high: 1, medium: 2, low: 3 };
    return priority[a.priority] - priority[b.priority];
  });

  return {
    overallScore,
    scores,
    readability,
    qaPatterns,
    citationWorthiness,
    aiStructure,
    recommendations: recommendations.map(enhanceRecommendation),  // <-- Add .map()
    contentStats: {
      wordCount: content.wordCount,
      paragraphCount: content.paragraphCount,
      headerCount: content.headers.h1.length + content.headers.h2.length + content.headers.h3.length,
    },
  };
}

function analyzeReadability(content) {
  const recommendations = [];
  
  // Get first 5000 words for readability analysis
  const textSample = content.bodyText.split(/\s+/).slice(0, 5000).join(' ');
  const metrics = calculateReadability(textSample);
  
  let score = 0;

  // Ideal readability for AI: 60-80 Flesch score (accessible but not oversimplified)
  if (metrics.fleschScore >= 60 && metrics.fleschScore <= 80) {
    score += 40;
  } else if (metrics.fleschScore >= 50 && metrics.fleschScore < 90) {
    score += 25;
  } else if (metrics.fleschScore >= 40) {
    score += 15;
  }

  // Sentence length (ideal: 15-20 words)
  if (metrics.avgWordsPerSentence >= 12 && metrics.avgWordsPerSentence <= 22) {
    score += 30;
  } else if (metrics.avgWordsPerSentence >= 10 && metrics.avgWordsPerSentence <= 28) {
    score += 20;
  } else {
    score += 5;
  }

  // Content depth
  if (content.wordCount >= 800) score += 20;
  else if (content.wordCount >= 500) score += 15;
  else if (content.wordCount >= 300) score += 10;

  // Paragraph variety
  if (content.paragraphCount >= 8) score += 10;
  else if (content.paragraphCount >= 5) score += 5;

  score = Math.min(score, 100);

  // Recommendations
  if (metrics.fleschScore < 50) {
    recommendations.push({
      priority: 'high',
      category: 'Readability',
      issue: `Content is difficult to read (Flesch score: ${metrics.fleschScore})`,
      action: 'Simplify language: use shorter sentences, common words, active voice',
      implementation: 'AI engines prefer clear, accessible content. Aim for Flesch score 60-70.',
    });
  } else if (metrics.fleschScore > 85) {
    recommendations.push({
      priority: 'medium',
      category: 'Readability',
      issue: `Content may be oversimplified (Flesch score: ${metrics.fleschScore})`,
      action: 'Add more depth and technical detail where appropriate',
      implementation: 'Very simple content may lack the authority AI engines look for',
    });
  }

  if (metrics.avgWordsPerSentence > 25) {
    recommendations.push({
      priority: 'medium',
      category: 'Readability',
      issue: `Sentences are too long (avg ${metrics.avgWordsPerSentence} words)`,
      action: 'Break long sentences into shorter ones (aim for 15-20 words)',
      implementation: 'Short, clear sentences are easier for AI to parse and quote',
    });
  }

  return {
    score,
    metrics,
    recommendations,
  };
}

function analyzeQAPatterns($, content, questionContent) {
  const recommendations = [];
  let score = 0;

  // Question-style headers
  const questionHeaders = questionContent.questionHeaders;
  const hasQuestionHeaders = questionHeaders.length >= 3;
  
  // FAQ section detection
  const hasFAQSection = questionContent.hasFAQText;

  // Direct answer patterns (content that starts with clear answers)
  const directAnswerPatterns = findDirectAnswers(content);

  // Definition patterns ("X is...", "X refers to...")
  const definitionPatterns = findDefinitions(content);

  // List-based answers
  const hasAnswerLists = content.lists.items >= 5;

  // Step-by-step content
  const hasStepContent = findStepContent($, content);

  // Scoring
  if (questionHeaders.length >= 5) score += 30;
  else if (questionHeaders.length >= 3) score += 20;
  else if (questionHeaders.length >= 1) score += 10;

  if (hasFAQSection) score += 20;
  if (directAnswerPatterns.count >= 3) score += 15;
  if (definitionPatterns.count >= 2) score += 10;
  if (hasAnswerLists) score += 15;
  if (hasStepContent) score += 10;

  score = Math.min(score, 100);

  // Recommendations
  if (questionHeaders.length < 3) {
    recommendations.push({
      priority: 'high',
      category: 'Q&A Patterns',
      issue: `Few question-style headers (${questionHeaders.length} found)`,
      action: 'Add headers that start with What, How, Why, When, etc.',
      implementation: 'Example: "What is [Topic]?", "How does [X] work?", "Why should you [action]?"',
    });
  }

  if (!hasFAQSection) {
    recommendations.push({
      priority: 'high',
      category: 'Q&A Patterns',
      issue: 'No FAQ section detected',
      action: 'Add a dedicated FAQ section with common questions and answers',
      implementation: 'FAQ sections are highly citable by AI engines. Include 5-10 Q&As.',
    });
  }

  if (directAnswerPatterns.count < 3) {
    recommendations.push({
      priority: 'medium',
      category: 'Q&A Patterns',
      issue: 'Limited direct answer patterns',
      action: 'Start paragraphs with clear, direct answers before elaborating',
      implementation: 'Example: "The answer is X. This is because..." rather than building up to the answer.',
    });
  }

  if (definitionPatterns.count < 2) {
    recommendations.push({
      priority: 'medium',
      category: 'Q&A Patterns',
      issue: 'Few definition statements',
      action: 'Include clear definitions of key terms',
      implementation: 'Example: "[Term] is a [category] that [definition]." AI often cites definitions.',
    });
  }

  return {
    score,
    questionHeaders: {
      count: questionHeaders.length,
      examples: questionHeaders.slice(0, 5),
    },
    hasFAQSection,
    directAnswers: directAnswerPatterns,
    definitions: definitionPatterns,
    hasStepContent,
    recommendations,
  };
}

function findDirectAnswers(content) {
  const directPatterns = [
    /^(the answer is|yes,|no,|it is|there are|you can|you should)/im,
    /^(in short|simply put|to summarize|basically|essentially)/im,
    /^(\d+ ?(ways|steps|tips|methods|reasons|types|examples))/im,
  ];

  let count = 0;
  const examples = [];

  content.paragraphs.forEach(p => {
    for (const pattern of directPatterns) {
      if (pattern.test(p)) {
        count++;
        if (examples.length < 3) {
          examples.push(p.substring(0, 100) + '...');
        }
        break;
      }
    }
  });

  return { count, examples };
}

function findDefinitions(content) {
  const definitionPatterns = [
    /\b(\w+)\s+(is|are|refers to|means|can be defined as)\s+/gi,
  ];

  let count = 0;
  const examples = [];

  const text = content.bodyText;
  for (const pattern of definitionPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
      examples.push(...matches.slice(0, 3));
    }
  }

  return { count: Math.min(count, 20), examples: examples.slice(0, 3) };
}

function findStepContent($, content) {
  // Check for step indicators
  const stepPatterns = /step\s*\d|first,|second,|third,|finally,|next,|then,/gi;
  const hasSteps = stepPatterns.test(content.bodyText);
  
  // Check for ordered lists
  const hasOrderedLists = content.lists.ordered > 0;

  return hasSteps || hasOrderedLists;
}

function analyzeCitationWorthiness($, content, meta) {
  const recommendations = [];
  let score = 0;

  // Authority signals
  const hasAuthor = !!meta.author;
  const hasPublishDate = !!meta.publishedTime;
  const hasModifiedDate = !!meta.modifiedTime;

  // Content depth
  const isComprehensive = content.wordCount >= 1000;
  const hasGoodDepth = content.wordCount >= 600;

  // Source indicators
  const hasSources = findSourceIndicators($, content);

  // Unique value indicators
  const hasOriginalData = findOriginalDataIndicators(content);

  // Expert language patterns
  const hasExpertLanguage = findExpertLanguage(content);

  // Specificity (numbers, data, specifics)
  const specificity = analyzeSpecificity(content);

  // Scoring
  if (hasAuthor) score += 10;
  if (hasPublishDate) score += 10;
  if (hasModifiedDate) score += 5;
  if (isComprehensive) score += 20;
  else if (hasGoodDepth) score += 10;
  if (hasSources.count >= 3) score += 15;
  else if (hasSources.count >= 1) score += 8;
  if (hasOriginalData) score += 15;
  if (hasExpertLanguage) score += 10;
  if (specificity.score >= 70) score += 15;
  else if (specificity.score >= 50) score += 10;

  score = Math.min(score, 100);

  // Recommendations
  if (!hasAuthor) {
    recommendations.push({
      priority: 'medium',
      category: 'Citation-Worthiness',
      issue: 'No author attribution found',
      action: 'Add author name and credentials to establish expertise',
      implementation: 'Use <meta name="author"> and visible author byline. AI prefers attributed content.',
    });
  }

  if (!hasPublishDate) {
    recommendations.push({
      priority: 'medium',
      category: 'Citation-Worthiness',
      issue: 'No publish date found',
      action: 'Add article publish date in meta tags and visibly on page',
      implementation: 'Use <meta property="article:published_time">. Dated content signals freshness.',
    });
  }

  if (hasSources.count < 2) {
    recommendations.push({
      priority: 'medium',
      category: 'Citation-Worthiness',
      issue: 'Limited source references',
      action: 'Reference external sources, studies, or data to support claims',
      implementation: 'Phrases like "according to [source]", "research shows", "[Study] found that"',
    });
  }

  if (specificity.score < 50) {
    recommendations.push({
      priority: 'high',
      category: 'Citation-Worthiness',
      issue: 'Content lacks specificity',
      action: 'Add specific numbers, percentages, dates, and data points',
      implementation: 'Instead of "many users", say "78% of users". Specifics are more citable.',
    });
  }

  if (!isComprehensive) {
    recommendations.push({
      priority: 'medium',
      category: 'Citation-Worthiness',
      issue: `Content may lack depth (${content.wordCount} words)`,
      action: 'Expand content to 1000+ words for comprehensive topic coverage',
      implementation: 'Thorough, authoritative content is more likely to be cited by AI',
    });
  }

  return {
    score,
    authoritySignals: {
      hasAuthor,
      author: meta.author,
      hasPublishDate,
      publishDate: meta.publishedTime,
      hasModifiedDate,
      modifiedDate: meta.modifiedTime,
    },
    sources: hasSources,
    hasOriginalData,
    hasExpertLanguage,
    specificity,
    recommendations,
  };
}

function findSourceIndicators($, content) {
  const sourcePatterns = [
    /according to/gi,
    /research (shows|indicates|suggests|found)/gi,
    /study (found|shows|indicates)/gi,
    /data (from|shows|indicates)/gi,
    /source:/gi,
    /\[\d+\]/g, // Citation brackets
  ];

  let count = 0;
  sourcePatterns.forEach(pattern => {
    const matches = content.bodyText.match(pattern);
    if (matches) count += matches.length;
  });

  // Check for external links (potential sources)
  const externalLinks = content.links.external;

  return {
    count: Math.min(count + Math.floor(externalLinks / 2), 20),
    externalLinks,
  };
}

function findOriginalDataIndicators(content) {
  const originalPatterns = [
    /our (research|study|analysis|data|survey|findings)/gi,
    /we (found|discovered|analyzed|surveyed|interviewed)/gi,
    /original (research|data|analysis)/gi,
    /proprietary/gi,
    /exclusive/gi,
  ];

  for (const pattern of originalPatterns) {
    if (pattern.test(content.bodyText)) return true;
  }
  return false;
}

function findExpertLanguage(content) {
  const expertPatterns = [
    /\b(methodology|empirical|hypothesis|correlation|causation)\b/gi,
    /\b(analysis|framework|implementation|optimization)\b/gi,
    /\b(best practices|industry standard|benchmark)\b/gi,
  ];

  let count = 0;
  expertPatterns.forEach(pattern => {
    const matches = content.bodyText.match(pattern);
    if (matches) count += matches.length;
  });

  return count >= 5;
}

function analyzeSpecificity(content) {
  const text = content.bodyText;
  
  // Count specific elements
  const numbers = (text.match(/\b\d+(\.\d+)?(%|percent|million|billion|thousand)?\b/gi) || []).length;
  const dates = (text.match(/\b(19|20)\d{2}\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi) || []).length;
  const properNouns = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []).length;
  
  // Calculate specificity score
  const wordCount = content.wordCount;
  const specificityRatio = (numbers + dates + (properNouns / 10)) / (wordCount / 100);
  const score = Math.min(Math.round(specificityRatio * 20), 100);

  return {
    score,
    numbers,
    dates,
    ratio: Math.round(specificityRatio * 100) / 100,
  };
}

function analyzeAIStructure($, content) {
  const recommendations = [];
  let score = 0;

  // First paragraph quality (often used for snippets)
  const firstParagraph = content.paragraphs[0] || '';
  const hasStrongOpening = firstParagraph.length >= 100 && firstParagraph.length <= 300;

  // Summary/TL;DR presence
  const hasSummary = /summary|tl;?dr|key (points|takeaways)|in (brief|short)/i.test(content.bodyText);

  // Conclusion presence
  const hasConclusion = /conclusion|final thoughts|wrap(ping)? up|in summary/i.test(content.bodyText);

  // Content chunking (sections)
  const sectionCount = content.headers.h2.length;
  const hasGoodChunking = sectionCount >= 3 && sectionCount <= 10;

  // Short, quotable sentences
  const quotableSentences = findQuotableSentences(content);

  // Key points/lists
  const hasKeyPoints = content.lists.items >= 3;

  // Scoring
  if (hasStrongOpening) score += 20;
  if (hasSummary) score += 20;
  if (hasConclusion) score += 10;
  if (hasGoodChunking) score += 20;
  if (quotableSentences.count >= 5) score += 15;
  if (hasKeyPoints) score += 15;

  score = Math.min(score, 100);

  // Recommendations
  if (!hasStrongOpening) {
    recommendations.push({
      priority: 'high',
      category: 'AI Structure',
      issue: 'Opening paragraph not optimized for AI snippets',
      action: 'Make first paragraph 100-200 words with a clear topic summary',
      implementation: 'First paragraph often becomes the AI-generated snippet. Make it count.',
    });
  }

  if (!hasSummary) {
    recommendations.push({
      priority: 'high',
      category: 'AI Structure',
      issue: 'No summary or key takeaways section',
      action: 'Add a "Key Takeaways" or "Summary" section',
      implementation: 'Place at top or bottom. AI engines often extract these for quick answers.',
    });
  }

  if (sectionCount < 3) {
    recommendations.push({
      priority: 'medium',
      category: 'AI Structure',
      issue: `Content not well-chunked (only ${sectionCount} sections)`,
      action: 'Break content into 4-7 distinct sections with H2 headers',
      implementation: 'Well-chunked content is easier for AI to extract relevant portions',
    });
  }

  if (quotableSentences.count < 5) {
    recommendations.push({
      priority: 'medium',
      category: 'AI Structure',
      issue: 'Few short, quotable sentences',
      action: 'Include standalone sentences that can be directly quoted',
      implementation: 'Short, definitive statements (15-25 words) are ideal for AI citations',
    });
  }

  return {
    score,
    firstParagraph: {
      length: firstParagraph.length,
      isOptimized: hasStrongOpening,
      preview: firstParagraph.substring(0, 200) + '...',
    },
    hasSummary,
    hasConclusion,
    sectionCount,
    quotableSentences,
    hasKeyPoints,
    recommendations,
  };
}

function findQuotableSentences(content) {
  const sentences = content.bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const quotable = sentences.filter(s => {
    const words = s.trim().split(/\s+/).length;
    return words >= 10 && words <= 30;
  });

  return {
    count: quotable.length,
    examples: quotable.slice(0, 3).map(s => s.trim().substring(0, 100) + '...'),
  };
}

module.exports = { analyzeContent };
