const express = require('express');
const Stats = require('../models/Stats');

const router = express.Router();

/**
 * GET /api/stats
 * Public endpoint - no authentication required
 * Returns cached global statistics
 * Cached for 1 minute on backend
 */
router.get('/', async (req, res) => {
  try {
    const stats = await Stats.getCached();
    
    // Add cache headers for client-side caching (30 seconds)
    res.set('Cache-Control', 'public, max-age=30');
    
    res.json(stats);
  } catch (error) {
    console.error('[Stats API] Error fetching stats:', error);
    
    // Return default values on error
    res.json({
      totalAnalyses: 950,
      totalUsers: 43
    });
  }
});

module.exports = router;