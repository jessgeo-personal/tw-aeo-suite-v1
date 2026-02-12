require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const { runCompleteAnalysis } = require('./analyzers');
const { User, Analysis, Usage, OTP, Stats } = require('./models');
const { 
  apiLimiter, 
  extractUser, 
  checkUsageLimit 
} = require('./middleware/auth');
const { sendOTPEmail } = require('./services/emailService');
const statsRouter = require('./routes/stats');

// Initialize Express app
const app = express();

// ============================================================================
// ENVIRONMENT-BASED ROUTING CONFIGURATION
// ============================================================================
// DigitalOcean App Platform strips /api prefix via ingress routing
// Local development needs /api prefix for frontend API calls
// Production: Routes defined WITHOUT /api (ingress adds it)
// Development: Routes defined WITH /api (direct calls)
// ============================================================================

const isProduction = process.env.NODE_ENV === 'production';
const API_PREFIX = isProduction ? '' : '/api';

console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔀 API Route Prefix: "${API_PREFIX}" ${isProduction ? '(DigitalOcean strips /api via ingress)' : '(Local development)'}`);

// Trust proxy - required for DigitalOcean load balancer
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'aeo-suite-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.error('💡 Make sure your MONGODB_URI in .env is correct');
  process.exit(1);
});

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============================================================================
// ROUTES - Environment-based prefix applied
// ============================================================================

// Stats route (using router)
app.use(`${API_PREFIX}/stats`, statsRouter);

// Health check endpoint
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({
    success: true,
    message: 'AEO Suite API is running',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: API_PREFIX,
    timestamp: new Date().toISOString()
  });
});

// Main analysis endpoint - unified for all 5 analyzers
app.post(`${API_PREFIX}/analyze`, 
  apiLimiter, 
  extractUser, 
  checkUsageLimit, 
  async (req, res) => {
    try {
      const { url, targetKeywords = [], email } = req.body;
      
      // Validate inputs
      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL is required'
        });
      }
      
      const userEmail = email || req.session?.email;
      
      if (!userEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
          requiresEmailCapture: true
        });
      }
      
      console.log(`Starting analysis for ${url} by ${userEmail}`);
      
      // Run complete analysis
      const result = await runCompleteAnalysis(url, targetKeywords);
      
      if (!result.success) {
        // Analysis failed - pass through detailed error info including blocking detection
        const errorResponse = {
          success: false,
          message: result.userMessage || result.error || 'Analysis failed',
          error: result.error
        };
        
        // Include blocking detection details if available
        if (result.blockDetection) {
          errorResponse.blockDetection = result.blockDetection;
          errorResponse.aeoImpact = result.aeoImpact;
          errorResponse.recommendation = result.recommendation;
        }
        
        return res.status(500).json(errorResponse);
      }
      
      // Get or create user
      let user = await User.findOne({ email: userEmail.toLowerCase().trim() });
      
      // Create analysis record
      const analysis = new Analysis({
        userId: user ? user._id : null,
        email: userEmail.toLowerCase().trim(),
        url,
        targetKeywords,
        overallScore: result.overallScore,
        technicalFoundation: result.analyzers.technicalFoundation,
        contentStructure: result.analyzers.contentStructure,
        pageLevelEEAT: result.analyzers.pageLevelEEAT,
        queryMatch: result.analyzers.queryMatch,
        aiVisibility: result.analyzers.aiVisibility,
        siteLevelEEAT: result.analyzers.siteLevelEEAT,
        status: 'completed',
        processingTime: result.processingTime
      });
      
      await analysis.save();
      
      // Update usage
      if (req.usage) {
        await req.usage.incrementUsage(analysis._id, url);
      }
      
      // Update stats
      await Stats.incrementAnalysis(userEmail, req.user?.isVerified || false);
      await Stats.trackUrl(url);
      await Stats.updateAverageScore({
        overall: result.overallScore,
        technical: result.analyzers.technicalFoundation.score,
        content: result.analyzers.contentStructure.score,
        eeat: result.analyzers.pageLevelEEAT.score,
        queryMatch: result.analyzers.queryMatch.score,
        visibility: result.analyzers.aiVisibility.score
      });
      
      // Calculate trend for Pro/Enterprise users
      const { calculateTrend } = require('./utils/trendCalculator');
      let trendData = null;
      if (user && (user.subscription.type === 'pro' || user.subscription.type === 'enterprise')) {
        trendData = await calculateTrend(url, userEmail, analysis._id);
      }

      console.log(`✅ Analysis completed: ${analysis._id}`);
      
      // Filter analyzers based on subscription tier
      const filteredAnalyzers = { ...result.analyzers };
      
      // Hide Site-Level EEAT for free users
      if (!user || (user.subscription.type !== 'pro' && user.subscription.type !== 'enterprise')) {
        filteredAnalyzers.siteLevelEEAT = null;
      }
      
      // Return results
      res.json({
        success: true,
        message: 'Analysis completed successfully',
        analysisId: analysis._id,
        results: {
          url,
          targetKeywords,
          overallScore: result.overallScore,
          overallGrade: result.overallGrade,
          analyzers: filteredAnalyzers, // Use filtered analyzers
          recommendations: result.recommendations,
          weights: result.weights,
          processingTime: result.processingTime
        },
        trend: trendData,
        usage: {
          current: req.currentUsage + 1,
          limit: req.dailyLimit,
          remaining: req.dailyLimit - (req.currentUsage + 1)
        }
      });
      
    } catch (error) {
      console.error('Analysis endpoint error:', error);
      
      // Pass through blocking detection if available
      const errorResponse = {
        success: false,
        message: error.message || 'An error occurred during analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
      
      // Include blocking detection from error object
      if (error.blockDetection) {
        errorResponse.blockDetection = error.blockDetection;
        errorResponse.aeoImpact = error.blockDetection.aeoImpact;
        errorResponse.recommendation = error.blockDetection.recommendation;
      }
      
      res.status(500).json(errorResponse);
    }
  }
);

// Request OTP endpoint
app.post(`${API_PREFIX}/auth/request-otp`, apiLimiter, async (req, res) => {
  try {
    const { email, firstName, lastName, country, phone } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Get or create user
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      user = new User({
        email: email.toLowerCase().trim(),
        firstName: firstName || '',
        lastName: lastName || '',
        country: country || 'Not specified',
        phone: phone || '',
        isVerified: false
      });
      await user.save();
      
      console.log(`New user created: ${email}`);
    }
    
    // Generate and send OTP
    const otpDoc = await OTP.createOTP(email);
    
    // Send OTP via Resend email service
    const emailResult = await sendOTPEmail(email, otpDoc.otp);
    
    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
    }
    
    // Log OTP for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 OTP for ${email}: ${otpDoc.otp}`);
    }
    
    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      email: email.toLowerCase().trim()
    });
    
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

// Verify OTP endpoint
app.post(`${API_PREFIX}/auth/verify-otp`, apiLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    // Verify OTP
    const result = await OTP.verifyOTP(email, otp);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Update user verification status
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user && !user.isVerified) {
      user.isVerified = true;
      // Don't set dailyLimit - getDailyLimit() handles it dynamically (5 for verified free users)
      await user.save();
    }
    
    // Set session
    req.session.email = email.toLowerCase().trim();
    req.session.verified = true;
    
    res.json({
      success: true,
      message: 'OTP verified successfully',
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        dailyLimit: user.getDailyLimit(),
        hasActiveSubscription: user.hasActiveSubscription(),
        subscription: {
          type: user.subscription.type || 'free',
          status: user.subscription.status || 'inactive',
          endDate: user.subscription.endDate || null
        }
      }
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    });
  }
});

// Get session endpoint
app.get(`${API_PREFIX}/auth/session`, extractUser, async (req, res) => {
  try {
    if (!req.session || !req.session.email) {
      return res.json({
        authenticated: false,
        user: null
      });
    }
    
    const user = await User.findOne({ email: req.session.email });
    
    if (!user) {
      return res.json({
        authenticated: false,
        user: null
      });
    }
    
    // Get usage for today
    const Usage = require('./models/Usage');
    const usage = await Usage.getTodayUsage(user.email);
    
    res.json({
      authenticated: true,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        dailyLimit: user.getDailyLimit(),
        hasActiveSubscription: user.hasActiveSubscription(),
        subscription: {
          type: user.subscription.type || 'free',
          status: user.subscription.status || 'inactive',
          endDate: user.subscription.endDate || null
        }
      },
      usage: {
        current: usage.count,
        limit: user.getDailyLimit(),
        remaining: user.getDailyLimit() - usage.count
      }
    });
    
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      authenticated: false,
      user: null,
      error: 'Failed to get session'
    });
  }
});

// Logout endpoint
app.post(`${API_PREFIX}/auth/logout`, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Lead submission endpoint (HubSpot integration)
app.post(`${API_PREFIX}/leads/submit`, apiLimiter, async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      company, 
      message,
      service 
    } = req.body;
    
    if (!email || !firstName) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }
    
    // Create or update HubSpot contact
    const hubspot = require('./utils/hubspot');
    const hubspotResult = await hubspot.createOrUpdateContact({
      email,
      firstName,
      lastName,
      phone,
      company,
      message,
      service
    });
    
    res.json({
      success: true,
      message: 'Thank you for your interest! We will be in touch at the earliest.',
      hubspotSynced: hubspotResult.success
    });

  } catch (error) {
    console.error('❌ Lead submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit lead form. Please try again.'
    });
  }
});

// PDF Export Endpoints (Pro feature)
const { generateSummaryPDF, generateDetailedPDF } = require('./utils/pdfGenerator');
const path = require('path');
const fs = require('fs');

app.post(`${API_PREFIX}/export/pdf`, extractUser, async (req, res) => {
  try {
    // Check authentication
    if (!req.session || !req.session.email) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check subscription
    if (!req.user || (req.user.subscription.type !== 'pro' && req.user.subscription.type !== 'enterprise')) {
      return res.status(403).json({
        success: false,
        message: 'PDF export is a Pro feature. Upgrade to access.',
        requiresUpgrade: true
      });
    }
    
    const { analysisId, type } = req.body;
    
    if (!analysisId) {
      return res.status(400).json({ success: false, message: 'Analysis ID required' });
    }
    
    if (!type || (type !== 'summary' && type !== 'detailed')) {
      return res.status(400).json({ success: false, message: 'Type must be "summary" or "detailed"' });
    }
    
    // Get analysis from database
    const analysis = await Analysis.findById(analysisId);
    
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }
    
    // Verify ownership
    if (analysis.email !== req.session.email) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Generate PDF
    const timestamp = Date.now();
    const filename = `aeo-report-${type}-${timestamp}.pdf`;
    const tmpDir = path.join(__dirname, 'tmp');
    const outputPath = path.join(tmpDir, filename);
    
    // Ensure tmp directory exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    let pdfPath;
    if (type === 'summary') {
      pdfPath = await generateSummaryPDF(analysis, outputPath);
    } else {
      pdfPath = await generateDetailedPDF(analysis, outputPath);
    }
    
    // Send file
    res.download(pdfPath, filename, (err) => {
      // Clean up file after download
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
      
      if (err) {
        console.error('PDF download error:', err);
        if (!res.headersSent) {
          return res.status(500).json({ success: false, message: 'Error downloading PDF' });
        }
      }
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error generating PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Analysis History Endpoints (Pro feature)
const { getTrendHistory } = require('./utils/trendCalculator');

app.get(`${API_PREFIX}/analyses/history`, extractUser, async (req, res) => {
  try {
    if (!req.session || !req.session.email) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!req.user || (req.user.subscription.type !== 'pro' && req.user.subscription.type !== 'enterprise')) {
      return res.status(403).json({
        success: false,
        message: 'Analysis history is a Pro feature',
        requiresUpgrade: true
      });
    }
    
    const { url, days = 30 } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL parameter required' });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const analyses = await Analysis.find({
      url: url.toLowerCase().trim(),
      email: req.session.email,
      status: 'completed',
      createdAt: { $gte: cutoffDate }
    })
    .sort({ createdAt: -1 })
    .select('overallScore createdAt technicalFoundation.score contentStructure.score pageLevelEEAT.score queryMatch.score aiVisibility.score');
    
    const trendHistory = await getTrendHistory(url, req.session.email, days);
    
    return res.json({
      success: true,
      analyses: analyses.map(a => ({
        id: a._id,
        date: a.createdAt,
        overallScore: a.overallScore,
        scores: {
          technical: a.technicalFoundation?.score || 0,
          content: a.contentStructure?.score || 0,
          eeat: a.pageLevelEEAT?.score || 0,
          queryMatch: a.queryMatch?.score || 0,
          aiVisibility: a.aiVisibility?.score || 0
        }
      })),
      trendHistory
    });
    
  } catch (error) {
    console.error('History fetch error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching history' });
  }
});

app.get(`${API_PREFIX}/analyses/history/export`, extractUser, async (req, res) => {
  try {
    if (!req.session || !req.session.email) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!req.user || (req.user.subscription.type !== 'pro' && req.user.subscription.type !== 'enterprise')) {
      return res.status(403).json({
        success: false,
        message: 'CSV export is a Pro feature',
        requiresUpgrade: true
      });
    }
    
    const { url, days = 30 } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL parameter required' });
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const analyses = await Analysis.find({
      url: url.toLowerCase().trim(),
      email: req.session.email,
      status: 'completed',
      createdAt: { $gte: cutoffDate }
    })
    .sort({ createdAt: -1 });
    
    let csv = 'Date,Overall Score,Technical,Content,E-E-A-T,Query Match,AI Visibility\n';
    
    analyses.forEach(a => {
      csv += `${new Date(a.createdAt).toLocaleDateString()},${a.overallScore},${a.technicalFoundation?.score || 0},${a.contentStructure?.score || 0},${a.pageLevelEEAT?.score || 0},${a.queryMatch?.score || 0},${a.aiVisibility?.score || 0}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=aeo-history-${Date.now()}.csv`);
    res.send(csv);
    
  } catch (error) {
    console.error('CSV export error:', error);
    return res.status(500).json({ success: false, message: 'Error exporting CSV' });
  }
});

// Get user's analysis history
app.get(`${API_PREFIX}/analyses`, extractUser, async (req, res) => {
  try {
    if (!req.session || !req.session.email) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const analyses = await Analysis.find({ 
      email: req.session.email 
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('-__v');
    
    res.json({
      success: true,
      count: analyses.length,
      analyses
    });
    
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analyses'
    });
  }
});

// ============================================================================
// TESTING ENDPOINTS - REMOVE BEFORE PRODUCTION
// ============================================================================

// Toggle subscription tier for testing
app.post(`${API_PREFIX}/test/toggle-subscription`, extractUser, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Testing endpoints disabled in production' });
    }
    
    if (!req.session || !req.session.email) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const { tier } = req.body; // 'free', 'pro', or 'enterprise'
    
    if (!['free', 'pro', 'enterprise'].includes(tier)) {
      return res.status(400).json({ success: false, message: 'Invalid tier. Use: free, pro, or enterprise' });
    }
    
    const user = await User.findOne({ email: req.session.email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update subscription
    if (tier === 'free') {
      user.subscription.type = 'free';
      user.subscription.status = 'inactive';
      user.subscription.startDate = null;
      user.subscription.endDate = null;
    } else {
      user.subscription.type = tier;
      user.subscription.status = 'active';
      user.subscription.startDate = new Date();
      user.subscription.endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }
    
    await user.save();
    
    return res.json({
      success: true,
      message: `Subscription updated to ${tier}`,
      subscription: user.subscription,
      dailyLimit: user.getDailyLimit()
    });
    
  } catch (error) {
    console.error('Toggle subscription error:', error);
    return res.status(500).json({ success: false, message: 'Error updating subscription' });
  }
});

// Get current user info for testing
app.get(`${API_PREFIX}/test/user-info`, extractUser, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Testing endpoints disabled in production' });
    }
    
    if (!req.session || !req.session.email) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    const user = await User.findOne({ email: req.session.email }).select('-__v');
    
    return res.json({
      success: true,
      user: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        subscription: user.subscription,
        dailyLimit: user.getDailyLimit(),
        isVerified: user.isVerified
      }
    });
    
  } catch (error) {
    console.error('Get user info error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching user info' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 AEO Suite API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`API Routes use prefix: "${API_PREFIX}"`);
});

module.exports = app;