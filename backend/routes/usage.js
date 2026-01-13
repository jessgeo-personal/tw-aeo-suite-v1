const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Usage = require('../models/Usage');
const { requireAuth, getDailyLimit } = require('../middleware/auth');

// Get usage limits for all tools
router.get('/limits', requireAuth, async (req, res) => {
  try {
    // Session should have userId from auth middleware
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Session invalid',
        message: 'Please log in again' 
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'Please log in again' 
      });
    }

    // Get Dubai timezone date
    const dubaiDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
    const todayStart = new Date(dubaiDate.setHours(0, 0, 0, 0));
    const todayEnd = new Date(dubaiDate.setHours(23, 59, 59, 999));

    const tools = ['technical', 'content', 'query-match', 'visibility'];
    const limits = {};

    // Get usage count and limit for each tool
    for (const tool of tools) {
      const dailyLimit = getDailyLimit(tool);
      
      const usageCount = await Usage.countDocuments({
        email: user.email,
        tool: tool,
        timestamp: {
          $gte: todayStart,
          $lte: todayEnd
        }
      });

      const resetTime = new Date(todayEnd);
      resetTime.setHours(24, 0, 0, 0); // Next midnight

      limits[tool] = {
        used: usageCount,
        limit: dailyLimit,
        remaining: dailyLimit - usageCount,
        canUse: usageCount < dailyLimit,
        resetAt: resetTime.toISOString()
      };
    }

    res.json({
      limits,
      subscription: user.subscription || { type: 'free' },
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Get limits error:', error);
    res.status(500).json({ 
      error: 'Failed to get usage limits',
      message: error.message 
    });
  }
});

// Get usage history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Session invalid' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const tool = req.query.tool; // Optional filter by tool

    const query = { email: user.email };
    if (tool) query.tool = tool;

    const history = await Usage.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('tool url timestamp results.overallScore');

    res.json({
      history,
      total: history.length
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      error: 'Failed to get usage history',
      message: error.message 
    });
  }
});

// Email report (future feature)
router.post('/email-report', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Session invalid' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // TODO: Implement email report functionality
    res.json({
      message: 'Email report feature coming soon',
      email: user.email
    });

  } catch (error) {
    console.error('Email report error:', error);
    res.status(500).json({ 
      error: 'Failed to send report',
      message: error.message 
    });
  }
});

module.exports = router;