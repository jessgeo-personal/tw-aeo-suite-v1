const {
  getGrade,
  extractText,
  getAllText,
  countKeywords,
  percentage
} = require('../utils/shared');

/**
 * Analyzer 4: Query Match
 * Evaluates keyword presence, answer positioning, semantic relevance
 */
async function analyzeQueryMatch($, url, targetKeywords = []) {
  const findings = {
    keywordPresence: { score: 0, details: {} },
    answerPositioning: { score: 0, details: {} },
    semanticRelevance: { score: 0, details: {} }
  };
  
  const recommendations = [];
  
  // If no keywords provided, return minimal analysis
  if (!targetKeywords || targetKeywords.length === 0) {
  const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
  const sortedRecommendations = recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 10);
    return {
      score: 0,
      grade: 'N/A',
      findings,
      recommendations: ['Provide target keywords to analyze query match effectiveness'],
      details: {
        maxScore: 100,
        message: 'No target keywords provided for analysis'
      }
    };
  }
  
  // Extract content sections
  const title = extractText($, 'title');
  const h1 = extractText($, 'h1');
  const metaDescription = extractText($, 'meta[name="description"]');
  const firstParagraph = $('article p, main p, body p').first().text().trim();
  const allHeadings = getAllText($, 'h1, h2, h3');
  const mainContent = $('article, main, body').first().text();
  
  // 1. KEYWORD PRESENCE ANALYSIS (40 points)
  findings.keywordPresence.details.keywords = {};
  
  targetKeywords.forEach(keyword => {
    const keywordData = {
      inTitle: title.toLowerCase().includes(keyword.toLowerCase()),
      inH1: h1.toLowerCase().includes(keyword.toLowerCase()),
      inMetaDescription: metaDescription.toLowerCase().includes(keyword.toLowerCase()),
      inFirstParagraph: firstParagraph.toLowerCase().includes(keyword.toLowerCase()),
      inHeadings: allHeadings.some(h => h.toLowerCase().includes(keyword.toLowerCase())),
      totalOccurrences: countKeywords(mainContent, [keyword])
    };
    
    findings.keywordPresence.details.keywords[keyword] = keywordData;
    
    // Score based on strategic placement
    let keywordScore = 0;
    
    if (keywordData.inTitle) keywordScore += 5;
    if (keywordData.inH1) keywordScore += 5;
    if (keywordData.inMetaDescription) keywordScore += 3;
    if (keywordData.inFirstParagraph) keywordScore += 3;
    if (keywordData.inHeadings) keywordScore += 2;
    if (keywordData.totalOccurrences >= 3) keywordScore += 2;
    
    findings.keywordPresence.score += Math.min(keywordScore, 15); // Max 15 per keyword
  });
  
  // Normalize keyword presence score to max 40 points
  const maxKeywordScore = targetKeywords.length * 15;
  findings.keywordPresence.score = Math.round((findings.keywordPresence.score / maxKeywordScore) * 40);
  
  // Recommendations for keyword optimization
  targetKeywords.forEach(keyword => {
    const data = findings.keywordPresence.details.keywords[keyword];
    
    if (!data.inTitle && !data.inH1) {
      recommendations.push({text:`Include "${keyword}" in title or H1 for better query matching`,why:`The keyword "${keyword}" is missing from your title and H1. AI engines heavily weight title/H1 keywords when matching queries. Without it, your page won't rank for "${keyword}" queries.`,howToFix:`Add "${keyword}" to your <title> tag and H1 heading. Place it naturally at the beginning. Example: "<title>${keyword}: Complete Guide</title>" and "<h1>Everything About ${keyword}</h1>".`,priority:'critical'});
    }
    if (!data.inFirstParagraph) {
      recommendations.push({text:`Mention "${keyword}" in the opening paragraph`,why:`"${keyword}" appears later but not in the opening. AI engines use the first 100 words to determine page topic. Delayed keyword mention reduces query match confidence.`,howToFix:`Add "${keyword}" to your first paragraph (first 100 words). Use it naturally in the opening sentence or second sentence. This signals immediate relevance to AI engines.`,priority:'high'});
    }
    if (data.totalOccurrences === 0) {
      recommendations.push({text:`"${keyword}" not found in content - add it naturally`,why:`Your target keyword "${keyword}" is completely missing from the content. Without the actual keyword, AI engines won't match your page to "${keyword}" queries at all. This is critical.`,howToFix:`Add "${keyword}" throughout your content naturally. Use it in: title, H1, first paragraph, H2 headings, body text. Aim for 3-5 mentions total without keyword stuffing. Make it natural.`,priority:'critical'});
    } else if (data.totalOccurrences < 3) {
      recommendations.push({text:`Increase keyword mentions (currently ${data.totalOccurrences})`,why:`"${keyword}" appears only ${data.totalOccurrences} time(s). Optimal keyword density is 3-5 mentions per page. Low frequency reduces AI query matching confidence.`,howToFix:`Add "${keyword}" naturally in 2-3 more places: H2 headings, body paragraphs, conclusion. Don't keyword stuff - keep it natural. Target 3-5 total mentions.`,priority:'medium'});
    }
  });
  
  // 2. ANSWER POSITIONING ANALYSIS (30 points)
  // Check if answer appears early in content (first 100 words)
  const first100Words = mainContent.split(/\s+/).slice(0, 100).join(' ');
  const hasEarlyAnswer = targetKeywords.some(keyword => 
    first100Words.toLowerCase().includes(keyword.toLowerCase())
  );
  
  findings.answerPositioning.details.keywordInFirst100Words = hasEarlyAnswer;
  
  if (hasEarlyAnswer) {
    findings.answerPositioning.score += 15;
  } else {
    recommendations.push({text:'Move key information higher in the content',why:'Key information appears too far down the page. AI engines prioritize content in the first 100-200 words. Important facts buried deep are less likely to be extracted and cited.',howToFix:'Restructure to front-load your main answer in the first 100 words. Start with the key takeaway, then elaborate. Use inverted pyramid style: most important first.',priority:'high'});
  }
  
  // Check for direct answer patterns
  const answerPatterns = [
    new RegExp(`(${targetKeywords.join('|')})\\s+(is|are|means|refers to)`, 'i'),
    /the answer is/i,
    /in short/i,
    /to summarize/i
  ];
  
  let hasDirectAnswer = false;
  answerPatterns.forEach(pattern => {
    if (pattern.test(mainContent)) {
      hasDirectAnswer = true;
    }
  });
  
  findings.answerPositioning.details.hasDirectAnswer = hasDirectAnswer;
  
  if (hasDirectAnswer) {
    findings.answerPositioning.score += 15;
  } else {
    recommendations.push({text:'Add a clear, direct answer to the main query early in the content',why:'Your content lacks a direct answer to the main query in the opening. AI engines look for explicit answers in the first 100-200 words. Without an upfront answer, citation likelihood drops significantly.',howToFix:'Add a 2-3 sentence direct answer to the main query in your first paragraph. Be explicit: "The answer is X". Then expand with details. AI engines need clear, immediate answers.',priority:'high'});
  }
  
  // 3. SEMANTIC RELEVANCE ANALYSIS (30 points)
  // Related terms and semantic variations
  const semanticVariations = generateSemanticVariations(targetKeywords);
  let semanticMatches = 0;
  
  semanticVariations.forEach(variation => {
    if (mainContent.toLowerCase().includes(variation.toLowerCase())) {
      semanticMatches++;
    }
  });
  
  findings.semanticRelevance.details.semanticVariationsFound = semanticMatches;
  findings.semanticRelevance.details.totalVariationsChecked = semanticVariations.length;
  
  const semanticCoverage = percentage(semanticMatches, semanticVariations.length);
  findings.semanticRelevance.details.semanticCoverage = semanticCoverage;
  
  if (semanticCoverage >= 50) {
    findings.semanticRelevance.score += 15;
  } else if (semanticCoverage >= 30) {
    findings.semanticRelevance.score += 10;
    recommendations.push({text:'Add more related terms and variations',why:'Your content has limited semantic coverage. AI engines use related terms to understand topic depth. More related terms signal comprehensive coverage.',howToFix:'Add synonyms, variations, related concepts. Example: if main term is "car", add "vehicle", "automobile", "sedan". Include 5-10 related terms naturally.',priority:'medium'});
  } else {
    recommendations.push({text:'Expand content to include related terms and concepts',why:'Your content lacks related terms and semantic variations. This signals thin coverage to AI engines. Without semantic breadth, content appears narrowly focused.',howToFix:'Expand to cover related concepts, synonyms, variations, related questions. Add sections on: types, examples, comparisons, alternatives. Build semantic richness.',priority:'high'});
  }
  
  // Topical depth - check for comprehensive coverage
  const topicalIndicators = [
    'benefits', 'drawbacks', 'advantages', 'disadvantages',
    'how to', 'examples', 'types', 'comparison',
    'best practices', 'tips', 'guide'
  ];
  
  let topicalDepth = 0;
  topicalIndicators.forEach(indicator => {
    if (mainContent.toLowerCase().includes(indicator)) {
      topicalDepth++;
    }
  });
  
  findings.semanticRelevance.details.topicalDepth = topicalDepth;
  
  if (topicalDepth >= 5) {
    findings.semanticRelevance.score += 15;
  } else if (topicalDepth >= 3) {
    findings.semanticRelevance.score += 10;
    recommendations.push({text:'Add more comprehensive coverage',why:'Content has some depth but could be more comprehensive. AI engines favor exhaustive coverage: examples, comparisons, best practices, FAQs.',howToFix:'Add sections on: real examples, step-by-step guides, comparisons, best practices, common mistakes, FAQs. Make content definitive.',priority:'medium'});
  } else {
    recommendations.push({text:'Expand content depth significantly',why:'Content lacks depth. AI engines favor comprehensive, authoritative content covering all aspects: what, why, how, types, examples, comparisons.',howToFix:'Expand dramatically: Add detailed examples, multiple types/categories, comparison tables, best practices, common mistakes, step-by-step guides, FAQs. Double your content length.',priority:'high'});
  }
  
  // Calculate total score
  const totalScore = findings.keywordPresence.score + findings.answerPositioning.score + 
                    findings.semanticRelevance.score;
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
        keywordPresence: { score: findings.keywordPresence.score, max: 40 },
        answerPositioning: { score: findings.answerPositioning.score, max: 30 },
        semanticRelevance: { score: findings.semanticRelevance.score, max: 30 }
      }
    }
  };
}

// Generate semantic variations for keywords
function generateSemanticVariations(keywords) {
  const variations = [];
  
  keywords.forEach(keyword => {
    const words = keyword.toLowerCase().split(/\s+/);
    
    // Add plural/singular variations
    words.forEach(word => {
      if (word.endsWith('s')) {
        variations.push(word.slice(0, -1));
      } else {
        variations.push(word + 's');
      }
    });
    
    // Add common prefixes/suffixes
    if (words.length === 1) {
      variations.push('best ' + keyword);
      variations.push(keyword + ' guide');
      variations.push('how to ' + keyword);
      variations.push(keyword + ' tips');
    }
  });
  
  return [...new Set(variations)]; // Remove duplicates
}

module.exports = { analyzeQueryMatch };