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
    console.error('❌ [Stats API Route] Error fetching stats:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Return default values on error (baseline only)
    res.json({
      totalAnalyses: 1025,
      totalUsers: 78 // Baseline user count
    });
  }
});

module.exports = router;