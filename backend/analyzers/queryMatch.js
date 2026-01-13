// ========================================
// RECOMMENDATION ENHANCEMENTS
// ========================================
const enhancements = {
  'Add direct question': {
    context: 'Users phrase the same question dozens of ways.',
    example: 'Stripe added variations like "How to accept payments" AND "How do I set up processing" - citations doubled.',
    reference: 'Pages answering 3+ question variations rank for 10x more AI queries.'
  },
  'Include answer upfront': {
    context: 'AI engines want immediate, direct answers they can extract.',
    example: 'Investopedia puts 1-2 sentence answer at top of every article - making them top financial source.',
    reference: 'Content with answers in first 100 words is 3x more likely to be featured.'
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
 * TOOL 3: Query Match Analyzer
 * Analyzes how well page content matches target queries/prompts
 * User provides queries they want to rank for, tool shows gaps and improvements
 */

const { extractContent, extractMeta, extractSchemas } = require('../utils');

function analyzeQueryMatch($, url, targetQueries) {
  const content = extractContent($);
  const meta = extractMeta($);
  const schemas = extractSchemas($);

  // ========================================
  // ANALYZE EACH QUERY
  // ========================================
  const queryAnalyses = targetQueries.map(query => analyzeQuery(query, content, meta, schemas));

  // ========================================
  // OVERALL MATCH SCORE
  // ========================================
  const avgScore = queryAnalyses.length > 0
    ? Math.round(queryAnalyses.reduce((sum, q) => sum + q.matchScore, 0) / queryAnalyses.length)
    : 0;

  // ========================================
  // CROSS-QUERY INSIGHTS
  // ========================================
  const insights = generateCrossQueryInsights(queryAnalyses, content);

  // ========================================
  // CONTENT GAPS
  // ========================================
  const contentGaps = identifyContentGaps(queryAnalyses, content);

  // ========================================
  // RECOMMENDATIONS
  // ========================================
  const recommendations = generateQueryRecommendations(queryAnalyses, contentGaps);

  return {
    overallScore: avgScore,
    queriesAnalyzed: queryAnalyses.length,
    queries: queryAnalyses,
    insights,
    contentGaps,
    recommendations: recommendations.map(enhanceRecommendation),  // <-- Add .map()
    pageInfo: {
      title: meta.title,
      wordCount: content.wordCount,
      url,
    },
  };
}

function analyzeQuery(query, content, meta, schemas) {
  const queryLower = query.toLowerCase();
  const queryWords = extractSignificantWords(queryLower);
  
  // ========================================
  // KEYWORD PRESENCE ANALYSIS
  // ========================================
  const keywordAnalysis = analyzeKeywordPresence(queryWords, content, meta);

  // ========================================
  // SEMANTIC RELEVANCE
  // ========================================
  const semanticRelevance = analyzeSemanticRelevance(queryLower, content, meta);

  // ========================================
  // INTENT MATCH
  // ========================================
  const intentMatch = analyzeIntentMatch(queryLower, content);

  // ========================================
  // ANSWER QUALITY
  // ========================================
  const answerQuality = analyzeAnswerQuality(queryLower, queryWords, content);

  // ========================================
  // CALCULATE MATCH SCORE
  // ========================================
  const matchScore = Math.round(
    (keywordAnalysis.score * 0.25) +
    (semanticRelevance.score * 0.25) +
    (intentMatch.score * 0.25) +
    (answerQuality.score * 0.25)
  );

  // ========================================
  // SPECIFIC IMPROVEMENTS
  // ========================================
  const improvements = generateQueryImprovements(query, keywordAnalysis, semanticRelevance, intentMatch, answerQuality);

  return {
    query,
    matchScore,
    matchLevel: getMatchLevel(matchScore),
    scores: {
      keywords: keywordAnalysis.score,
      semantic: semanticRelevance.score,
      intent: intentMatch.score,
      answerQuality: answerQuality.score,
    },
    keywordAnalysis,
    semanticRelevance,
    intentMatch,
    answerQuality,
    improvements,
  };
}

function extractSignificantWords(query) {
  // Remove common stop words
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'she', 'it',
    'how', 'why', 'when', 'where', 'all', 'each', 'every', 'any', 'some',
  ]);

  return query.split(/\s+/)
    .map(w => w.replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length > 2 && !stopWords.has(w));
}

function analyzeKeywordPresence(queryWords, content, meta) {
  const bodyTextLower = content.bodyText.toLowerCase();
  const titleLower = meta.title.toLowerCase();
  const descLower = meta.description.toLowerCase();
  const headersLower = [
    ...content.headers.h1,
    ...content.headers.h2,
    ...content.headers.h3,
  ].join(' ').toLowerCase();

  const keywordResults = queryWords.map(word => {
    const inTitle = titleLower.includes(word);
    const inDescription = descLower.includes(word);
    const inHeaders = headersLower.includes(word);
    const inBody = bodyTextLower.includes(word);
    
    // Count occurrences in body
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const bodyCount = (content.bodyText.match(regex) || []).length;

    return {
      word,
      inTitle,
      inDescription,
      inHeaders,
      inBody,
      bodyCount,
      found: inTitle || inDescription || inHeaders || inBody,
    };
  });

  // Calculate score
  let score = 0;
  const foundCount = keywordResults.filter(k => k.found).length;
  const totalKeywords = queryWords.length;

  if (totalKeywords > 0) {
    // Base score for keyword presence
    score += (foundCount / totalKeywords) * 40;

    // Bonus for title presence
    const inTitleCount = keywordResults.filter(k => k.inTitle).length;
    score += (inTitleCount / totalKeywords) * 25;

    // Bonus for header presence
    const inHeadersCount = keywordResults.filter(k => k.inHeaders).length;
    score += (inHeadersCount / totalKeywords) * 20;

    // Bonus for description presence
    const inDescCount = keywordResults.filter(k => k.inDescription).length;
    score += (inDescCount / totalKeywords) * 15;
  }

  score = Math.min(Math.round(score), 100);

  const missingKeywords = keywordResults.filter(k => !k.found).map(k => k.word);
  const weakKeywords = keywordResults.filter(k => k.found && k.bodyCount < 3).map(k => k.word);

  return {
    score,
    keywords: keywordResults,
    summary: {
      total: totalKeywords,
      found: foundCount,
      inTitle: keywordResults.filter(k => k.inTitle).length,
      inHeaders: keywordResults.filter(k => k.inHeaders).length,
      inDescription: keywordResults.filter(k => k.inDescription).length,
    },
    missingKeywords,
    weakKeywords,
  };
}

function analyzeSemanticRelevance(query, content, meta) {
  let score = 0;
  const signals = [];

  // Check for related terms and concepts
  const queryType = identifyQueryType(query);
  
  // Topic alignment
  const topicWords = extractTopicWords(query);
  const contentTopics = extractContentTopics(content);
  const topicOverlap = topicWords.filter(t => contentTopics.has(t)).length;
  
  if (topicOverlap > 0) {
    score += Math.min((topicOverlap / topicWords.length) * 50, 50);
    signals.push(`${topicOverlap}/${topicWords.length} topic terms found`);
  }

  // Check if content type matches query type
  if (queryType.type === 'how-to' && content.lists.ordered > 0) {
    score += 20;
    signals.push('Has step-by-step content for how-to query');
  }

  if (queryType.type === 'what-is' && hasDefinitionContent(content)) {
    score += 20;
    signals.push('Has definition content for what-is query');
  }

  if (queryType.type === 'comparison' && hasComparisonContent(content)) {
    score += 20;
    signals.push('Has comparison content');
  }

  if (queryType.type === 'list' && content.lists.items >= 5) {
    score += 20;
    signals.push('Has list content for list-type query');
  }

  // Title relevance
  const titleWords = new Set(meta.title.toLowerCase().split(/\s+/));
  const queryWords = new Set(query.split(/\s+/));
  const titleOverlap = [...queryWords].filter(w => titleWords.has(w)).length;
  if (titleOverlap >= 2) {
    score += 15;
    signals.push('Strong title relevance');
  }

  score = Math.min(Math.round(score), 100);

  return {
    score,
    queryType,
    signals,
    topicAlignment: {
      queryTopics: topicWords,
      matchedTopics: topicWords.filter(t => contentTopics.has(t)),
    },
  };
}

function identifyQueryType(query) {
  const queryLower = query.toLowerCase();

  if (/^how (to|do|can|does)/i.test(queryLower)) {
    return { type: 'how-to', description: 'Instructional/procedural query' };
  }
  if (/^what (is|are|does)/i.test(queryLower)) {
    return { type: 'what-is', description: 'Definitional query' };
  }
  if (/^why/i.test(queryLower)) {
    return { type: 'why', description: 'Explanatory query' };
  }
  if (/^(which|best|top|compare|vs|versus|difference)/i.test(queryLower)) {
    return { type: 'comparison', description: 'Comparison/evaluation query' };
  }
  if (/^(when|where)/i.test(queryLower)) {
    return { type: 'factual', description: 'Factual query' };
  }
  if (/(\d+|list|ways|tips|steps|examples|types)/i.test(queryLower)) {
    return { type: 'list', description: 'List-based query' };
  }
  
  return { type: 'general', description: 'General informational query' };
}

function extractTopicWords(query) {
  const words = extractSignificantWords(query.toLowerCase());
  // Add related concept expansion (simplified)
  return words;
}

function extractContentTopics(content) {
  const text = content.bodyText.toLowerCase();
  const words = text.split(/\s+/)
    .map(w => w.replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length > 3);
  return new Set(words);
}

function hasDefinitionContent(content) {
  const patterns = [
    /\bis (a|an|the)\b/i,
    /\brefers to\b/i,
    /\bcan be defined as\b/i,
    /\bmeans\b/i,
  ];
  return patterns.some(p => p.test(content.bodyText));
}

function hasComparisonContent(content) {
  const patterns = [
    /\bvs\.?\b/i,
    /\bversus\b/i,
    /\bcompared to\b/i,
    /\bdifference between\b/i,
    /\badvantages and disadvantages\b/i,
    /\bpros and cons\b/i,
  ];
  return patterns.some(p => p.test(content.bodyText));
}

function analyzeIntentMatch(query, content) {
  let score = 0;
  const signals = [];
  const queryType = identifyQueryType(query);

  // Check if content structure matches intent
  switch (queryType.type) {
    case 'how-to':
      if (content.lists.ordered > 0) {
        score += 30;
        signals.push('Has numbered steps');
      }
      if (/step\s*\d|first|second|third|finally/i.test(content.bodyText)) {
        score += 25;
        signals.push('Has step language');
      }
      if (content.headers.h2.some(h => /how|step|guide/i.test(h))) {
        score += 20;
        signals.push('Has how-to headers');
      }
      break;

    case 'what-is':
      if (hasDefinitionContent(content)) {
        score += 40;
        signals.push('Has definition patterns');
      }
      if (content.paragraphs[0]?.length >= 50) {
        score += 20;
        signals.push('Has substantive opening paragraph');
      }
      break;

    case 'comparison':
      if (hasComparisonContent(content)) {
        score += 35;
        signals.push('Has comparison language');
      }
      if (content.tables > 0) {
        score += 25;
        signals.push('Has comparison tables');
      }
      if (content.lists.items >= 5) {
        score += 15;
        signals.push('Has comparison lists');
      }
      break;

    case 'list':
      if (content.lists.items >= 5) {
        score += 40;
        signals.push('Has substantial list content');
      }
      if (content.headers.h2.length >= 3) {
        score += 20;
        signals.push('Has multiple sections');
      }
      break;

    case 'why':
      if (/because|reason|due to|result of|caused by/i.test(content.bodyText)) {
        score += 40;
        signals.push('Has explanatory language');
      }
      break;

    default:
      // General query - check for comprehensive content
      if (content.wordCount >= 500) score += 25;
      if (content.headers.h2.length >= 3) score += 25;
      if (content.paragraphCount >= 5) score += 25;
  }

  // Bonus for FAQ structure regardless of query type
  if (/faq|frequently asked/i.test(content.bodyText)) {
    score += 15;
    signals.push('Has FAQ section');
  }

  score = Math.min(Math.round(score), 100);

  return {
    score,
    queryType,
    signals,
    contentFeatures: {
      hasLists: content.lists.items > 0,
      hasTables: content.tables > 0,
      hasSteps: /step\s*\d/i.test(content.bodyText),
      hasDefinitions: hasDefinitionContent(content),
      hasComparisons: hasComparisonContent(content),
    },
  };
}

function analyzeAnswerQuality(query, queryWords, content) {
  let score = 0;
  const signals = [];

  // Check for direct answer patterns
  const firstParagraph = content.paragraphs[0] || '';
  const hasDirectAnswer = queryWords.some(word => 
    firstParagraph.toLowerCase().includes(word)
  );

  if (hasDirectAnswer) {
    score += 25;
    signals.push('First paragraph contains query terms');
  }

  // Check for answer completeness
  const queryWordCount = queryWords.length;
  const foundInFirst300 = queryWords.filter(word => 
    content.bodyText.substring(0, 1500).toLowerCase().includes(word)
  ).length;

  if (queryWordCount > 0 && foundInFirst300 / queryWordCount >= 0.7) {
    score += 25;
    signals.push('Most query terms appear early in content');
  }

  // Check for quotable answer sentences
  const sentences = content.bodyText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const quotableAnswers = sentences.filter(s => {
    const words = s.trim().split(/\s+/).length;
    const containsQueryWord = queryWords.some(w => s.toLowerCase().includes(w));
    return words >= 10 && words <= 35 && containsQueryWord;
  });

  if (quotableAnswers.length >= 3) {
    score += 25;
    signals.push(`${quotableAnswers.length} quotable answer sentences found`);
  } else if (quotableAnswers.length >= 1) {
    score += 15;
    signals.push(`${quotableAnswers.length} quotable answer sentence(s) found`);
  }

  // Check for answer specificity
  const hasNumbers = /\b\d+(\.\d+)?(%|percent)?\b/i.test(content.bodyText);
  const hasExamples = /for example|such as|e\.g\.|including/i.test(content.bodyText);
  
  if (hasNumbers) {
    score += 12;
    signals.push('Contains specific numbers/data');
  }
  if (hasExamples) {
    score += 13;
    signals.push('Contains examples');
  }

  score = Math.min(Math.round(score), 100);

  return {
    score,
    signals,
    quotableAnswers: {
      count: quotableAnswers.length,
      examples: quotableAnswers.slice(0, 2).map(s => s.trim().substring(0, 150) + '...'),
    },
    hasDirectAnswer,
    hasSpecifics: hasNumbers || hasExamples,
  };
}

function getMatchLevel(score) {
  if (score >= 80) return { level: 'Strong', color: 'green', description: 'Content is well-optimized for this query' };
  if (score >= 60) return { level: 'Good', color: 'lightgreen', description: 'Content matches but could be improved' };
  if (score >= 40) return { level: 'Moderate', color: 'yellow', description: 'Partial match - significant improvements needed' };
  if (score >= 20) return { level: 'Weak', color: 'orange', description: 'Limited relevance to query' };
  return { level: 'Poor', color: 'red', description: 'Content does not address this query' };
}

function generateQueryImprovements(query, keywordAnalysis, semanticRelevance, intentMatch, answerQuality) {
  const improvements = [];

  // Keyword improvements
  if (keywordAnalysis.missingKeywords.length > 0) {
    improvements.push({
      type: 'keywords',
      priority: 'high',
      issue: `Missing key terms: ${keywordAnalysis.missingKeywords.join(', ')}`,
      action: `Add these terms naturally to your content, especially in headers and opening paragraphs`,
    });
  }

  if (keywordAnalysis.summary.inTitle === 0 && keywordAnalysis.summary.total > 0) {
    improvements.push({
      type: 'title',
      priority: 'high',
      issue: 'Query terms not in page title',
      action: `Include "${keywordAnalysis.keywords[0]?.word || 'key terms'}" in your page title`,
    });
  }

  if (keywordAnalysis.summary.inHeaders === 0) {
    improvements.push({
      type: 'headers',
      priority: 'high',
      issue: 'Query terms not in any headers',
      action: `Add an H2 header that includes query terms, e.g., "What is ${keywordAnalysis.keywords[0]?.word || '[topic]'}?"`,
    });
  }

  // Intent improvements
  if (intentMatch.score < 50) {
    const queryType = intentMatch.queryType;
    let suggestion = '';
    
    switch (queryType.type) {
      case 'how-to':
        suggestion = 'Add numbered steps or a step-by-step guide section';
        break;
      case 'what-is':
        suggestion = 'Add a clear definition in the first paragraph';
        break;
      case 'comparison':
        suggestion = 'Add a comparison table or pros/cons list';
        break;
      case 'list':
        suggestion = 'Format content as a numbered or bulleted list';
        break;
      default:
        suggestion = 'Restructure content to directly address the query';
    }

    improvements.push({
      type: 'intent',
      priority: 'high',
      issue: `Content structure doesn't match "${queryType.type}" query intent`,
      action: suggestion,
    });
  }

  // Answer quality improvements
  if (answerQuality.quotableAnswers.count < 2) {
    improvements.push({
      type: 'answers',
      priority: 'medium',
      issue: 'Few quotable answer sentences',
      action: 'Add 2-3 clear, standalone sentences (15-25 words) that directly answer the query',
    });
  }

  if (!answerQuality.hasDirectAnswer) {
    improvements.push({
      type: 'opening',
      priority: 'high',
      issue: 'First paragraph doesn\'t address the query',
      action: 'Rewrite opening paragraph to immediately address the query topic',
    });
  }

  return improvements;
}

function generateCrossQueryInsights(queryAnalyses, content) {
  const insights = [];

  // Find common missing keywords
  const allMissing = queryAnalyses.flatMap(q => q.keywordAnalysis.missingKeywords);
  const missingCounts = {};
  allMissing.forEach(k => missingCounts[k] = (missingCounts[k] || 0) + 1);
  const commonMissing = Object.entries(missingCounts)
    .filter(([k, count]) => count >= 2)
    .map(([k]) => k);

  if (commonMissing.length > 0) {
    insights.push({
      type: 'gap',
      message: `Terms missing across multiple queries: ${commonMissing.join(', ')}`,
      action: 'Add these terms to strengthen relevance for multiple target queries',
    });
  }

  // Check for intent mismatches
  const lowIntentMatches = queryAnalyses.filter(q => q.intentMatch.score < 40);
  if (lowIntentMatches.length >= 2) {
    insights.push({
      type: 'structure',
      message: `Content structure doesn't match ${lowIntentMatches.length} query intents`,
      action: 'Consider restructuring content or creating separate pages for different query types',
    });
  }

  // Strong performers
  const strongMatches = queryAnalyses.filter(q => q.matchScore >= 70);
  if (strongMatches.length > 0) {
    insights.push({
      type: 'strength',
      message: `Content is well-optimized for ${strongMatches.length} queries`,
      action: 'Maintain these strengths while improving weaker areas',
    });
  }

  return insights;
}

function identifyContentGaps(queryAnalyses, content) {
  const gaps = [];

  // Check for missing content types
  const needsSteps = queryAnalyses.some(q => q.intentMatch.queryType.type === 'how-to' && q.intentMatch.score < 50);
  const needsDefinition = queryAnalyses.some(q => q.intentMatch.queryType.type === 'what-is' && q.intentMatch.score < 50);
  const needsComparison = queryAnalyses.some(q => q.intentMatch.queryType.type === 'comparison' && q.intentMatch.score < 50);
  const needsList = queryAnalyses.some(q => q.intentMatch.queryType.type === 'list' && q.intentMatch.score < 50);

  if (needsSteps && content.lists.ordered === 0) {
    gaps.push({
      type: 'how-to',
      issue: 'Missing step-by-step instructions',
      solution: 'Add a numbered list with clear steps',
    });
  }

  if (needsDefinition && !hasDefinitionContent(content)) {
    gaps.push({
      type: 'definition',
      issue: 'Missing clear definitions',
      solution: 'Add "[Topic] is..." definitions for key terms',
    });
  }

  if (needsComparison && !hasComparisonContent(content)) {
    gaps.push({
      type: 'comparison',
      issue: 'Missing comparison content',
      solution: 'Add comparison table or pros/cons section',
    });
  }

  if (needsList && content.lists.items < 5) {
    gaps.push({
      type: 'list',
      issue: 'Insufficient list content',
      solution: 'Convert key points into bulleted or numbered lists',
    });
  }

  // Check for FAQ gap
  if (!(/faq|frequently asked/i.test(content.bodyText)) && queryAnalyses.length >= 3) {
    gaps.push({
      type: 'faq',
      issue: 'No FAQ section',
      solution: 'Add FAQ section using target queries as questions',
    });
  }

  return gaps;
}

function generateQueryRecommendations(queryAnalyses, contentGaps) {
  const recommendations = [];

  // Prioritize by impact
  const weakQueries = queryAnalyses.filter(q => q.matchScore < 50);
  
  if (weakQueries.length > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'Query Match',
      issue: `${weakQueries.length} target queries have weak content match`,
      action: 'Focus on improving content for these queries first',
      details: weakQueries.map(q => q.query).slice(0, 3),
    });
  }

  // Add content gap recommendations
  contentGaps.forEach(gap => {
    recommendations.push({
      priority: 'high',
      category: 'Content Gap',
      issue: gap.issue,
      action: gap.solution,
    });
  });

  // General improvements
  const avgKeywordScore = queryAnalyses.reduce((sum, q) => sum + q.keywordAnalysis.score, 0) / queryAnalyses.length;
  if (avgKeywordScore < 60) {
    recommendations.push({
      priority: 'high',
      category: 'Keywords',
      issue: 'Overall keyword optimization is weak',
      action: 'Review and incorporate target query terms throughout content',
    });
  }

  return recommendations.sort((a, b) => {
    const priority = { critical: 0, high: 1, medium: 2, low: 3 };
    return priority[a.priority] - priority[b.priority];
  });
}

module.exports = { analyzeQueryMatch };
