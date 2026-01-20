const User = require('../models/User');
const Usage = require('../models/Usage');

// Get daily limit for a specific tool from environment variables
const getDailyLimit = (toolName) => {
  // Check for tool-specific limit first
  const toolLimitKey = `DAILY_LIMIT_${toolName.toUpperCase().replace('-', '_')}`;
  const toolLimit = parseInt(process.env[toolLimitKey]);
  
  if (!isNaN(toolLimit) && toolLimit > 0) {
    return toolLimit;
  }
  
  // Fall back to global limit
  const globalLimit = parseInt(process.env.DAILY_LIMIT_ALL);
  if (!isNaN(globalLimit) && globalLimit > 0) {
    return globalLimit;
  }
  
  // Default to 1 if nothing is set
  return 1;
};

// Authentication middleware
const requireAuth = (req, res, next) => {
  console.log('[requireAuth] Checking authentication');
  console.log('[requireAuth] Session ID:', req.sessionID);
  console.log('[requireAuth] Session data:', {
    userId: req.session?.userId,
    email: req.session?.email,
    verified: req.session?.verified
  });
  console.log('[requireAuth] Cookies received:', req.headers.cookie);
  
  if (!req.session || !req.session.userId) {
    console.log('[requireAuth] FAILED - No session or userId');
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  console.log('[requireAuth] PASSED for user:', req.session.email);
  next();
};

// Check if user has reached daily limit for a specific tool
function checkUsageLimit(toolName) {
  return async (req, res, next) => {
    // Skip if usage limits are disabled
    if (process.env.ENABLE_USAGE_LIMITS !== 'true') {
      return next();
    }

    try {
      const userId = req.session.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Skip limits for subscribed users
      if (user.subscription && user.subscription.type !== 'free') {
        return next();
      }

      // Get the limit for this specific tool
      const dailyLimit = getDailyLimit(toolName);

      // Get Dubai date string (YYYY-MM-DD)
      const todayDate = Usage.getDubaiDateString();

      // Count usage for this tool today
      const usageCount = await Usage.countDocuments({
        email: user.email,
        tool: toolName,
        date: todayDate
      });

      // Check if limit reached
      if (usageCount >= dailyLimit) {
        // Calculate next midnight Dubai time
        const dubaiNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
        const resetTime = new Date(dubaiNow);
        resetTime.setHours(24, 0, 0, 0);

        return res.status(429).json({
          error: 'Daily limit reached',
          message: `You've used all ${dailyLimit} daily analyses for this tool. Limit resets at 12 AM Dubai time.`,
          used: usageCount,
          limit: dailyLimit,
          resetAt: resetTime.toISOString(),
          tool: toolName
        });
      }

      // Attach usage info to request
      req.usageInfo = {
        used: usageCount,
        limit: dailyLimit,
        remaining: dailyLimit - usageCount
      };

      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({ error: 'Failed to check usage limits' });
    }
  };
}

// Record usage after successful analysis
function recordUsage(toolName) {
  return async (req, res, next) => {
    // Skip if usage limits are disabled
    if (process.env.ENABLE_USAGE_LIMITS !== 'true') {
      return next();
    }

    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Only record usage if analysis was successful
      if (res.statusCode === 200 && data && !data.error) {
        // Run this async without blocking the response
        (async () => {
          try {
            const userId = req.session?.userId;
            if (!userId) {
              console.error('[Record Usage] No user session');
              return;
            }

            const user = await User.findById(userId);
            if (!user) {
              console.error('[Record Usage] User not found:', userId);
              return;
            }

            await Usage.recordUsage(
              userId,
              user.email,
              toolName,
              req.body.url,
              data
            );
            console.log(`✓ Usage recorded: ${toolName} by ${user.email}`);
          } catch (error) {
            console.error(`[${toolName}] Record usage error:`, error.message);
            // Don't fail the request if recording fails
          }
        })();
      }

      // Call original json method immediately (don't wait for usage recording)
      return originalJson(data);
    };

    next();
  };
}

// Get usage limits for all tools
const getUsageLimits = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get Dubai date string (YYYY-MM-DD)
    const todayDate = Usage.getDubaiDateString();

    const tools = ['technical', 'content', 'query-match', 'visibility'];
    const limits = {};

    // Get usage count and limit for each tool
    for (const tool of tools) {
      const dailyLimit = getDailyLimit(tool);
      
      const usageCount = await Usage.countDocuments({
        email: user.email,
        tool: tool,
        date: todayDate
      });

      // Calculate next midnight Dubai time for reset
      const dubaiNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
      const nextMidnight = new Date(dubaiNow);
      nextMidnight.setHours(24, 0, 0, 0);
      
      limits[tool] = {
        used: usageCount,
        limit: dailyLimit,
        remaining: dailyLimit - usageCount,
        canUse: usageCount < dailyLimit,
        resetAt: nextMidnight.toISOString()
      };
    }

    res.json({
      limits,
      subscription: user.subscription || { type: 'free' }
    });

  } catch (error) {
    console.error('Get usage limits error:', error);
    res.status(500).json({ error: 'Failed to get usage limits' });
  }
};

module.exports = {
  requireAuth,
  checkUsageLimit,
  recordUsage,
  getUsageLimits,
  getDailyLimit
};