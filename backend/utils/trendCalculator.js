const { Analysis } = require('../models');

/**
 * Calculate trend for a URL compared to last analysis
 * Returns: { hasPreviousAnalysis, previousScore, currentScore, delta, trend: 'up'|'down'|'same', percentage }
 */
async function calculateTrend(url, email, currentAnalysisId) {
  try {
    // Find the two most recent analyses for this URL by this user
    const analyses = await Analysis.find({
      url: url.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      status: 'completed'
    })
    .sort({ createdAt: -1 })
    .limit(2)
    .select('overallScore createdAt');
    
    if (analyses.length < 2) {
      return {
        hasPreviousAnalysis: false,
        message: 'No previous analysis for comparison'
      };
    }
    
    const current = analyses[0];
    const previous = analyses[1];
    
    const delta = current.overallScore - previous.overallScore;
    const percentage = previous.overallScore > 0 
      ? Math.round((delta / previous.overallScore) * 100) 
      : 0;
    
    let trend = 'same';
    if (delta > 0) trend = 'up';
    if (delta < 0) trend = 'down';
    
    return {
      hasPreviousAnalysis: true,
      previousScore: previous.overallScore,
      previousDate: previous.createdAt,
      currentScore: current.overallScore,
      currentDate: current.createdAt,
      delta: Math.abs(delta),
      trend,
      percentage: Math.abs(percentage),
      daysSince: Math.round((current.createdAt - previous.createdAt) / (1000 * 60 * 60 * 24))
    };
    
  } catch (error) {
    console.error('Trend calculation error:', error);
    return {
      hasPreviousAnalysis: false,
      error: 'Error calculating trend'
    };
  }
}

/**
 * Get trend history for last 30 days
 */
async function getTrendHistory(url, email, days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const analyses = await Analysis.find({
      url: url.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      status: 'completed',
      createdAt: { $gte: cutoffDate }
    })
    .sort({ createdAt: 1 }) // Chronological order
    .select('overallScore createdAt');
    
    return analyses.map(a => ({
      score: a.overallScore,
      date: a.createdAt
    }));
    
  } catch (error) {
    console.error('Trend history error:', error);
    return [];
  }
}

module.exports = {
  calculateTrend,
  getTrendHistory
};