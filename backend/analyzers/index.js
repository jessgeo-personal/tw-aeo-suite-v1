const { fetchPage } = require('../utils/pageFetcher');
const { analyzeTechnicalFoundation } = require('./technicalFoundation');
const { analyzeContentStructure } = require('./contentStructure');
const { analyzePageLevelEEAT } = require('./pageLevelEEAT');
const { analyzeQueryMatch } = require('./queryMatch');
const { analyzeAIVisibility } = require('./aiVisibility');
const { getGrade } = require('../utils/shared');

/**
 * Main analyzer orchestrator
 * Runs all 5 analyzers and calculates weighted overall score
 */
async function runCompleteAnalysis(url, targetKeywords = []) {
  try {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }
    
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const startTime = Date.now();
    
    // Fetch the page
    console.log(`Fetching page: ${url}`);
    const { $, html } = await fetchPage(url);
    
    // Run all 5 analyzers in parallel
    console.log('Running analyzers...');
    const [
      technicalFoundation,
      contentStructure,
      pageLevelEEAT,
      queryMatch,
      aiVisibility
    ] = await Promise.all([
      analyzeTechnicalFoundation($, url),
      analyzeContentStructure($, url),
      analyzePageLevelEEAT($, url),
      analyzeQueryMatch($, url, targetKeywords),
      analyzeAIVisibility($, url)
    ]);
    
    // Calculate weighted overall score
    const weights = {
      technicalFoundation: 0.25,  // 25%
      contentStructure: 0.25,     // 25%
      pageLevelEEAT: 0.20,        // 20%
      queryMatch: 0.15,           // 15%
      aiVisibility: 0.15          // 15%
    };
    
    const overallScore = Math.round(
      technicalFoundation.score * weights.technicalFoundation +
      contentStructure.score * weights.contentStructure +
      pageLevelEEAT.score * weights.pageLevelEEAT +
      queryMatch.score * weights.queryMatch +
      aiVisibility.score * weights.aiVisibility
    );
    
    const overallGrade = getGrade(overallScore);
    
    // Collect all recommendations (prioritized)
    // Handle both old string format and new object format
    const normalizeRecommendation = (r, analyzer) => {
      if (typeof r === 'string') {
        // Old format: string only
        return { 
          text: r, 
          why: '', 
          howToFix: '', 
          priority: 'medium', 
          analyzer 
        };
      } else {
        // New format: object with text, why, howToFix, priority
        return { ...r, analyzer };
      }
    };
    
    const allRecommendations = [
      ...technicalFoundation.recommendations.map(r => normalizeRecommendation(r, 'Technical Foundation')),
      ...contentStructure.recommendations.map(r => normalizeRecommendation(r, 'Content Structure')),
      ...pageLevelEEAT.recommendations.map(r => normalizeRecommendation(r, 'E-E-A-T')),
      ...queryMatch.recommendations.map(r => normalizeRecommendation(r, 'Query Match')),
      ...aiVisibility.recommendations.map(r => normalizeRecommendation(r, 'AI Visibility'))
    ];
    
    // Sort by priority: critical first, then high, medium, low
    const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
    const topRecommendations = allRecommendations
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 15);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      url,
      targetKeywords,
      overallScore,
      overallGrade,
      processingTime,
      analyzers: {
        technicalFoundation,
        contentStructure,
        pageLevelEEAT,
        queryMatch,
        aiVisibility
      },
      recommendations: topRecommendations,
      weights,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    return {
      success: false,
      error: error.message || 'Analysis failed',
      url,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  runCompleteAnalysis
};