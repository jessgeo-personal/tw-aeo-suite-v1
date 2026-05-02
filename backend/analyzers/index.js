const { fetchPage } = require('../utils/pageFetcher');
const { analyzeTechnicalFoundation } = require('./technicalFoundation');
const { analyzeContentStructure } = require('./contentStructure');
const { analyzePageLevelEEAT } = require('./pageLevelEEAT');
const { analyzeQueryMatch } = require('./queryMatch');
const { analyzeAIVisibility } = require('./aiVisibility');
const { getGrade } = require('../utils/shared');
const { analyzeSiteLevelEEAT } = require('./siteLevelEEAT');

/**
 * Main analyzer orchestrator
 * Runs all 5 analyzers and calculates weighted overall score
 * Enhanced with bot/crawler blocking detection
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
    
    // Fetch the page (with enhanced bot blocking detection)
    console.log(`Fetching page: ${url}`);
    const fetchResult = await fetchPage(url);
    const { $, html, blockDetection } = fetchResult;
    
    // If bot blocking was detected, add critical warning to recommendations
    let blockingWarning = null;
    if (blockDetection && blockDetection.isBlocked) {
      blockingWarning = {
        text: `⚠️ CRITICAL AEO ISSUE: Bot/Crawler Blocking Detected - ${blockDetection.blockType}`,
        why: blockDetection.aeoImpact,
        howToFix: blockDetection.recommendation,
        priority: 'critical',
        analyzer: 'Site Accessibility',
        evidence: blockDetection.evidence,
        blockType: blockDetection.blockType
      };

      console.log(`🚨 Bot blocking detected: ${blockDetection.blockType}`);
      console.log(`   Evidence: ${blockDetection.evidence.join(', ')}`);
    }

    // Multi-UA probe results — enrich blockingWarning with 3-state status
    const multiUAProbeResult = fetchResult.multiUAProbeResult || null;
    if (multiUAProbeResult) {
      console.log(`🔍 Multi-UA Probe: ${multiUAProbeResult.blockingStatusLabel}`);

      // If multi-UA probe found blocking but single fetch did not, create warning
      if (!blockingWarning && multiUAProbeResult.blockingSeverity !== 'none') {
        blockingWarning = {
          text: `⚠️ AEO ISSUE: ${multiUAProbeResult.blockingStatusLabel}`,
          why: multiUAProbeResult.aiCrawlersBlocked
            ? 'AI search engines (ChatGPT, Claude, Perplexity) are being blocked from accessing your content. You will not appear in AI-generated answers.'
            : 'AIOptimizeBot is being blocked. AI crawlers may still access your site but analysis accuracy is reduced.',
          howToFix: multiUAProbeResult.aiCrawlersBlocked
            ? 'Allow GPTBot, ClaudeBot, and PerplexityBot in your WAF/Cloudflare settings. See the bot management guide.'
            : 'Add AIOptimizeBot to your allowlist in Cloudflare or your WAF. User-agent: AIOptimizeBot',
          priority: multiUAProbeResult.blockingSeverity === 'critical' ? 'critical' : 'medium',
          analyzer: 'Site Accessibility',
          evidence: [
            `GPTBot probe: ${multiUAProbeResult.probes.gptBot.blocked ? 'BLOCKED' : 'OK'} (HTTP ${multiUAProbeResult.probes.gptBot.status})`,
            `AIOptimizeBot probe: ${multiUAProbeResult.probes.aeoBot.blocked ? 'BLOCKED' : 'OK'} (HTTP ${multiUAProbeResult.probes.aeoBot.status})`,
            `Browser probe: ${multiUAProbeResult.probes.browser.blocked ? 'BLOCKED' : 'OK'} (HTTP ${multiUAProbeResult.probes.browser.status})`
          ],
          blockType: multiUAProbeResult.blockingStatus,
          multiUAProbeResult // attach full detail for frontend
        };
      } else if (blockingWarning) {
        // Enrich existing warning with multi-UA detail
        blockingWarning.multiUAProbeResult = multiUAProbeResult;
        blockingWarning.evidence = blockingWarning.evidence || {};
        blockingWarning.multiUAEvidence = [
          `GPTBot probe: ${multiUAProbeResult.probes.gptBot.blocked ? 'BLOCKED' : 'OK'} (HTTP ${multiUAProbeResult.probes.gptBot.status})`,
          `AIOptimizeBot probe: ${multiUAProbeResult.probes.aeoBot.blocked ? 'BLOCKED' : 'OK'} (HTTP ${multiUAProbeResult.probes.aeoBot.status})`,
          `Browser probe: ${multiUAProbeResult.probes.browser.blocked ? 'BLOCKED' : 'OK'} (HTTP ${multiUAProbeResult.probes.browser.status})`
        ];
      }
    }
    
    // Extract domain for site-level analysis
    const urlObj = new URL(url);
    const domain = urlObj.origin;

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

    // Run site-level E-E-A-T (Pro/Enterprise feature)
    let siteLevelEEAT = null;
    if (isPremium) {
      try {
        console.log('Running site-level E-E-A-T analysis...');
        siteLevelEEAT = await analyzeSiteLevelEEAT(domain);
      } catch (error) {
        console.error('Site-level E-E-A-T analysis failed:', error);
        // Don't fail entire analysis if site-level fails
        siteLevelEEAT = null;
      }
    } else {
      console.log('Skipping site-level E-E-A-T (Premium feature)');
      siteLevelEEAT = {
        status: 'skipped',
        message: 'Site-level EEAT is only available for Pro and Enterprise subscribers.'
      };
    }
    
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
      // Add blocking warning FIRST if detected
      ...(blockingWarning ? [blockingWarning] : []),
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
        aiVisibility,
        siteLevelEEAT
      },
      recommendations: topRecommendations,
      weights,
      blockDetection: blockDetection || null, // Include block detection results
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Check if error includes bot blocking detection
    const blockDetection = error.blockDetection || null;
    
    // Create enhanced error response
    const errorResponse = {
      success: false,
      error: error.message || 'Analysis failed',
      url,
      timestamp: new Date().toISOString()
    };
    
    // If blocking was detected, include detailed information
    if (blockDetection && blockDetection.isBlocked) {
      errorResponse.blockDetection = blockDetection;
      errorResponse.userMessage = `Unable to analyze this website: ${blockDetection.blockType}`;
      errorResponse.aeoImpact = blockDetection.aeoImpact;
      errorResponse.recommendation = blockDetection.recommendation;
      
      console.log(`🚨 Analysis failed due to blocking: ${blockDetection.blockType}`);
      console.log(`   AEO Impact: ${blockDetection.aeoImpact}`);
      console.log(`   Recommendation: ${blockDetection.recommendation}`);
    }
    
    return errorResponse;
  }
}

module.exports = {
  runCompleteAnalysis
};