const {
  getGrade,
  extractText,
  getAllText,
  calculateReadingTime,
  calculateFleschScore,
  hasElement,
  countElements,
  percentage
} = require('../utils/shared');

/**
 * Analyzer 2: Content Structure
 * Evaluates readability, Q&A patterns, factual density
 */
async function analyzeContentStructure($, url) {
  const findings = {
    readability: { score: 0, details: {} },
    qaPatterns: { score: 0, details: {} },
    factualDensity: { score: 0, details: {} }
  };
  
  const recommendations = [];
  
  // Extract main content (prioritize article, main, or body)
  let mainContent = '';
  if ($('article').length > 0) {
    mainContent = $('article').text();
  } else if ($('main').length > 0) {
    mainContent = $('main').text();
  } else {
    mainContent = $('body').text();
  }
  
  mainContent = mainContent.trim();
  const wordCount = mainContent.split(/\s+/).length;
  
  // 1. READABILITY ANALYSIS (35 points)
  findings.readability.details.wordCount = wordCount;
  findings.readability.details.readingTime = calculateReadingTime(mainContent);
  
  // Word count scoring
  if (wordCount >= 1000) {
    findings.readability.score += 15; // Substantial content
  } else if (wordCount >= 500) {
    findings.readability.score += 10;
    recommendations.push({
      text: 'Expand content to 1000+ words for better AI comprehension and authority',
      why: 'AI models process content more effectively when it\'s substantial (1000+ words) yet readable. Comprehensive content signals expertise and provides AI engines with enough information to cite confidently. Too short lacks depth and context for comprehensive answers.',
      howToFix: 'Expand your content to at least 1,000 words. Add more detail, examples, statistics, and explanations. Cover the topic from multiple angles - benefits, drawbacks, how-to steps, and real-world applications. Current word count: ' + wordCount + ' words.',
      priority: 'high'
    });
  } else {
    findings.readability.score += 5;
    recommendations.push({
      text: 'Content is too short. Add more comprehensive information (aim for 1000+ words)',
      why: 'Content under 500 words is considered "thin content" by AI engines. It lacks the depth needed for comprehensive answers and signals low expertise. AI engines heavily favor longer, detailed content that thoroughly addresses topics.',
      howToFix: 'Significantly expand your content. Add detailed explanations, multiple examples, step-by-step guides, benefits and drawbacks, FAQs, and real-world applications. Target at least 1,000 words minimum. Current word count: ' + wordCount + ' words.',
      priority: 'critical'
    });
  }
  
  // Flesch reading ease
  const fleschScore = calculateFleschScore(mainContent);
  findings.readability.details.fleschScore = Math.round(fleschScore);
  findings.readability.details.readingLevel = getReadingLevel(fleschScore);
  
  if (fleschScore >= 60 && fleschScore <= 70) {
    findings.readability.score += 10; // Optimal readability
  } else if (fleschScore >= 50 && fleschScore < 80) {
    findings.readability.score += 7;
    recommendations.push({
      text: 'Good readability, but consider simplifying complex sentences for better AI parsing',
      why: 'The Flesch Reading Ease Score ensures your content hits the sweet spot for AI comprehension. Your current score (' + Math.round(fleschScore) + ') is acceptable but not optimal. Scores between 60-70 maximize both human and AI understanding.',
      howToFix: 'Break long sentences into shorter ones (15-20 words average). Use simpler words where possible without losing meaning. Use transition phrases to maintain flow. Target Flesch score: 60-70. Current score: ' + Math.round(fleschScore) + '.',
      priority: 'medium'
    });
  } else if (fleschScore < 50) {
    recommendations.push({
      text: 'Content is difficult to read. Simplify sentences and reduce jargon for better AI understanding',
      why: 'Your Flesch score of ' + Math.round(fleschScore) + ' indicates very complex content. Too complex reduces AI parsing accuracy and citation likelihood. AI engines struggle with academic-level complexity and may skip citing your content in favor of more accessible sources.',
      howToFix: 'Significantly simplify your writing. Break very long sentences (25+ words) into multiple shorter sentences. Replace complex vocabulary with simpler alternatives. Use active voice instead of passive. Add transition words. Remove unnecessary jargon. Target Flesch score: 60-70.',
      priority: 'high'
    });
    findings.readability.score += 3;
  } else {
    findings.readability.score += 5;
  }
  
  // Paragraph structure
  const paragraphs = mainContent.split(/\n\n+/).filter(p => p.trim().length > 0);
  findings.readability.details.paragraphCount = paragraphs.length;
  const avgParagraphLength = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / paragraphs.length;
  findings.readability.details.avgParagraphLength = Math.round(avgParagraphLength);
  
  if (avgParagraphLength >= 50 && avgParagraphLength <= 150) {
    findings.readability.score += 10;
  } else if (avgParagraphLength < 50) {
    findings.readability.score += 5;
    recommendations.push({
      text: 'Paragraphs are too short. Combine related ideas for better flow',
      why: 'Very short paragraphs (under 50 words) create choppy reading and suggest incomplete thoughts. AI engines prefer well-developed paragraphs that fully explain ideas. Current average: ' + Math.round(avgParagraphLength) + ' words.',
      howToFix: 'Combine related short paragraphs into cohesive units. Each paragraph should develop one complete idea with supporting details. Aim for 50-150 words per paragraph (3-5 sentences). Add transition sentences to connect ideas smoothly.',
      priority: 'medium'
    });
  } else {
    findings.readability.score += 5;
    recommendations.push({
      text: 'Break down long paragraphs into shorter chunks for better scanability',
      why: 'Paragraphs over 150 words are difficult to scan and process quickly. AI engines favor well-structured, digestible chunks of information. Long paragraphs suggest poor organization. Current average: ' + Math.round(avgParagraphLength) + ' words.',
      howToFix: 'Split long paragraphs at natural break points. Each paragraph should cover one main idea. Use 3-5 sentences per paragraph (50-150 words). Start new paragraphs when introducing new points or examples.',
      priority: 'medium'
    });
  }
  
  // 2. Q&A PATTERNS ANALYSIS (35 points)
  // Look for question-answer patterns
  const questionPatterns = [
    /\bwhat is\b/gi,
    /\bhow to\b/gi,
    /\bwhy\b/gi,
    /\bwhen\b/gi,
    /\bwhere\b/gi,
    /\bwho\b/gi,
    /\?\s*$/gm
  ];
  
  let questionCount = 0;
  questionPatterns.forEach(pattern => {
    const matches = mainContent.match(pattern);
    if (matches) questionCount += matches.length;
  });
  
  findings.qaPatterns.details.questionCount = questionCount;
  
  // Check for FAQ schema
  const hasFAQSchema = $('script[type="application/ld+json"]').text().includes('FAQPage');
  findings.qaPatterns.details.hasFAQSchema = hasFAQSchema;
  
  if (hasFAQSchema) {
    findings.qaPatterns.score += 20;
  } else if (questionCount >= 3) {
    findings.qaPatterns.score += 10;
    recommendations.push({
      text: 'Add FAQPage schema markup to highlight your Q&A content for AI engines',
      why: 'You have ' + questionCount + ' questions in your content but no FAQPage schema. AI engines love content structured as questions and answers because it directly matches how users search. FAQPage schema makes this Q&A structure explicit and machine-readable, dramatically increasing citation likelihood.',
      howToFix: 'Add FAQPage schema markup using JSON-LD in your <head> section. Include each question as a "Question" entity with its corresponding "acceptedAnswer". Use schema.org/FAQPage format. This explicitly tells AI engines "this is a question" and "this is the answer".',
      priority: 'high'
    });
  } else {
    recommendations.push({
      text: 'Add FAQ section with common questions to improve AI answer potential',
      why: 'AI engines prioritize content that directly answers user questions. When users ask questions to AI search engines, the AI looks for content that already answers those questions. Content with clear Q&A structure is exponentially more likely to be cited.',
      howToFix: 'Add an FAQ section to your page with 5-10 common questions users ask about your topic. Format questions as H2 or H3 headings (e.g., "What is...", "How to...", "Why..."). Provide direct, concise answers (2-3 sentences) immediately after each question. Then implement FAQPage schema markup.',
      priority: 'high'
    });
  }
  
  // Check for clear answers (sentences after questions)
  const sentences = mainContent.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  let answerPatterns = 0;
  
  sentences.forEach((sentence, idx) => {
    if (sentence.includes('?') && sentences[idx + 1]) {
      answerPatterns++;
    }
  });
  
  findings.qaPatterns.details.answerPatterns = answerPatterns;
  
  if (answerPatterns >= 3) {
    findings.qaPatterns.score += 15;
  } else if (answerPatterns > 0) {
    findings.qaPatterns.score += 7;
    recommendations.push({
      text: 'Add more direct question-answer pairs to increase AI citation likelihood',
      why: 'You have ' + answerPatterns + ' question-answer pairs, but AI engines prefer pages with 3+ clear Q&A patterns. Direct question-answer formats make it easy for AI to extract and cite your content when users ask similar questions.',
      howToFix: 'Add more questions throughout your content followed immediately by direct answers. Use question marks explicitly. Format: "Question here?" followed by "Answer here." Aim for at least 5 Q&A pairs. This creates multiple citation opportunities.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Structure content with clear questions followed by concise answers',
      why: 'Your content lacks question-answer patterns. AI engines match user queries to content that explicitly addresses those queries. Without clear Q&A structure, AI engines must infer answers, reducing citation confidence and likelihood.',
      howToFix: 'Restructure key sections as explicit question-answer pairs. Use actual question marks. Example: "What are the benefits? [Answer]" or "How does it work? [Answer]". Start with 5 common user questions and provide 2-3 sentence answers immediately after each question.',
      priority: 'high'
    });
  }
  
  // 3. FACTUAL DENSITY ANALYSIS (30 points)
  // Numbers and statistics
  const numberMatches = mainContent.match(/\b\d+(\.\d+)?%?\b/g);
  findings.factualDensity.details.statisticsCount = numberMatches ? numberMatches.length : 0;
  
  if (findings.factualDensity.details.statisticsCount >= 5) {
    findings.factualDensity.score += 10;
  } else if (findings.factualDensity.details.statisticsCount > 0) {
    findings.factualDensity.score += 5;
    recommendations.push({
      text: 'Add more statistics and data points to increase factual density',
      why: 'You have ' + findings.factualDensity.details.statisticsCount + ' statistics/numbers, but AI engines strongly prefer content with 5+ specific data points. Vague statements are rarely cited; specific facts with numbers are highly citable. Numbers signal expertise and increase citation confidence.',
      howToFix: 'Add specific numbers, percentages, dates, quantities, and measurements throughout your content. Replace general statements with precise data. Example: Instead of "many users", say "73% of users". Include time estimates, costs, measurements, success rates, and comparative statistics.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Include specific numbers, percentages, and statistics to support claims',
      why: 'Your content lacks numerical data entirely. AI engines are more confident citing content that includes specific, verifiable facts. Without numbers, your content appears opinion-based rather than fact-based, severely reducing citation likelihood.',
      howToFix: 'Add at least 5 specific data points to your content. Include percentages, quantities, time frames, costs, measurements, or comparative numbers. Example: "costs $50", "takes 2 hours", "increases efficiency by 40%". Numbers make content more authoritative and citable.',
      priority: 'high'
    });
  }
  
  // Lists (bullet points or numbered)
  const listItems = countElements($, 'li');
  findings.factualDensity.details.listItems = listItems;
  
  if (listItems >= 5) {
    findings.factualDensity.score += 10;
  } else if (listItems > 0) {
    findings.factualDensity.score += 5;
    recommendations.push({
      text: 'Add more lists to improve content scanability and structure',
      why: 'You have ' + listItems + ' list items, but AI engines excel at extracting information from well-organized lists (5+ items optimal). Lists are highly scannable and make it easy for AI to identify distinct points, features, or steps. Listed information is cited more frequently than prose-only content.',
      howToFix: 'Convert key information into bullet points or numbered lists. Use lists for: features, benefits, steps in a process, requirements, options, or examples. Aim for 5+ list items per major section. Lists signal well-organized, digestible information.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Use bullet points or numbered lists to organize information clearly',
      why: 'Your content lacks lists entirely. Lists make content scannable and help AI engines extract discrete facts. Without lists, important information blends together in paragraphs, reducing AI parsing accuracy and citation likelihood. Lists are one of the easiest ways to structure information for AI comprehension.',
      howToFix: 'Add bullet points or numbered lists to organize key information. Identify groups of related items (features, steps, benefits, requirements) and format them as <ul> or <ol> lists. Start with at least 5 list items. Use parallel structure for list items.',
      priority: 'high'
    });
  }
  
  // Citations and references
  const citationPatterns = [/according to/gi, /research shows/gi, /study found/gi, /source:/gi];
  let citationCount = 0;
  
  citationPatterns.forEach(pattern => {
    const matches = mainContent.match(pattern);
    if (matches) citationCount += matches.length;
  });
  
  findings.factualDensity.details.citationCount = citationCount;
  
  if (citationCount >= 3) {
    findings.factualDensity.score += 10;
  } else if (citationCount > 0) {
    findings.factualDensity.score += 5;
    recommendations.push({
      text: 'Add more citations and references to strengthen credibility',
      why: 'You have ' + citationCount + ' citations, but AI engines prefer content with 3+ references to authoritative sources. Citations signal that your content is well-researched and backed by evidence. Referenced content is considered more trustworthy and citable.',
      howToFix: 'Add references to authoritative sources (research papers, industry reports, expert statements) throughout your content. Use phrases like "According to [source]", "Research shows", "[Organization] reports", "Studies indicate". Link to the original sources when possible.',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      text: 'Reference authoritative sources to support your claims',
      why: 'Your content lacks citations to external sources. AI engines favor content that references authoritative sources because it signals credibility and reduces the risk of misinformation. Unsupported claims are far less likely to be cited than fact-backed statements.',
      howToFix: 'Add at least 3 citations to reputable sources that support your main points. Reference industry research, academic studies, government data, or recognized expert statements. Use phrases like "According to [Source Name]" or "Research by [Organization] found". Link to sources when possible.',
      priority: 'high'
    });
  }
  
  // Calculate total score
  const totalScore = findings.readability.score + findings.qaPatterns.score + findings.factualDensity.score;
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
        readability: { score: findings.readability.score, max: 35 },
        qaPatterns: { score: findings.qaPatterns.score, max: 35 },
        factualDensity: { score: findings.factualDensity.score, max: 30 }
      }
    }
  };
}

function getReadingLevel(fleschScore) {
  if (fleschScore >= 90) return 'Very Easy (5th grade)';
  if (fleschScore >= 80) return 'Easy (6th grade)';
  if (fleschScore >= 70) return 'Fairly Easy (7th grade)';
  if (fleschScore >= 60) return 'Standard (8-9th grade)';
  if (fleschScore >= 50) return 'Fairly Difficult (10-12th grade)';
  if (fleschScore >= 30) return 'Difficult (College)';
  return 'Very Difficult (College graduate)';
}

module.exports = { analyzeContentStructure };