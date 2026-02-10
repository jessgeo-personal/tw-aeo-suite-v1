const rateLimit = require('express-rate-limit');
const { User, Usage } = require('../models');

// Rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Trust DigitalOcean's proxy headers for accurate IP tracking
  trustProxy: true,
  // Use X-Forwarded-For header (DigitalOcean provides this)
  validate: { trustProxy: false } // Disable validation that was causing the error
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Trust DigitalOcean's proxy headers for accurate IP tracking
  trustProxy: true,
  validate: { trustProxy: false } // Disable validation that was causing the error
});

// Middleware to extract user from session
const extractUser = async (req, res, next) => {
  try {
    // Check if email exists in session
    if (req.session && req.session.email) {
      req.userEmail = req.session.email;
      
      // Try to get user from database
      const user = await User.findOne({ email: req.session.email });
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    console.error('Error extracting user:', error);
    next();
  }
};

// Middleware to check if user is authenticated (has verified email)
const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.email) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please verify your email first.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error occurred.'
    });
  }
};

// Middleware to check daily usage limits
const checkUsageLimit = async (req, res, next) => {
  try {
    // Get email from session or request body
    const email = req.session?.email || req.body?.email;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required to check usage limits.',
        requiresEmailCapture: true
      });
    }
    
    // Get user to determine daily limit
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const dailyLimit = user ? user.getDailyLimit() : 3; // Default to anonymous limit
    
    // Get today's usage
    const usage = await Usage.getTodayUsage(email);
    
    // Check if limit exceeded
    if (usage.hasExceededLimit(dailyLimit)) {
      return res.status(429).json({
        success: false,
        message: `Daily limit of ${dailyLimit} analyses reached. ${
          user?.hasActiveSubscription() 
            ? 'Please try again tomorrow.' 
            : user?.isVerified 
              ? 'Upgrade to a subscription for unlimited analyses.' 
              : 'Please register for more daily analyses or upgrade to a subscription.'
        }`,
        limitExceeded: true,
        dailyLimit,
        currentUsage: usage.count,
        isSubscribed: user?.hasActiveSubscription() || false,
        isRegistered: user?.isVerified || false
      });
    }
    
    // Attach usage info to request for later use
    req.usage = usage;
    req.dailyLimit = dailyLimit;
    req.currentUsage = usage.count;
    
    next();
  } catch (error) {
    console.error('Usage limit check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking usage limits.'
    });
  }
};

// Middleware to verify OTP
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.'
      });
    }
    
    const OTP = require('../models/OTP');
    const result = await OTP.verifyOTP(email, otp);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Set session
    req.session.email = email.toLowerCase().trim();
    req.session.verified = true;
    
    next();
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying OTP.'
    });
  }
};

// Middleware to check subscription status
const requireSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!req.user.hasActiveSubscription()) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required for this feature.',
        requiresSubscription: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription status.'
    });
  }
};

module.exports = {
  apiLimiter,
  authLimiter,
  extractUser,
  requireAuth,
  checkUsageLimit,
  verifyOTP,
  requireSubscription
};