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

app.use('/api/stats', statsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AEO Suite API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Main analysis endpoint - unified for all 5 analyzers
app.post('/api/analyze', 
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
        return res.status(500).json({
          success: false,
          message: result.error || 'Analysis failed',
          error: result.error
        });
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
        status: 'completed',
        processingTime: result.processingTime
      });
      
      await analysis.save();
      
      // Update usage
      if (req.usage) {
        await req.usage.incrementUsage(analysis._id, url);
      }
      
      // Update stats
      await Stats.incrementAnalysis();
      await Stats.trackUrl(url);
      await Stats.updateAverageScore({
        overall: result.overallScore,
        technical: result.analyzers.technicalFoundation.score,
        content: result.analyzers.contentStructure.score,
        eeat: result.analyzers.pageLevelEEAT.score,
        queryMatch: result.analyzers.queryMatch.score,
        visibility: result.analyzers.aiVisibility.score
      });
      
      console.log(`✅ Analysis completed: ${analysis._id}`);
      
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
          analyzers: result.analyzers,
          recommendations: result.recommendations,
          weights: result.weights,
          processingTime: result.processingTime
        },
        usage: {
          current: req.currentUsage + 1,
          limit: req.dailyLimit,
          remaining: req.dailyLimit - (req.currentUsage + 1)
        }
      });
      
    } catch (error) {
      console.error('Analysis endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Request OTP endpoint
app.post('/api/auth/request-otp', apiLimiter, async (req, res) => {
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
      // Still return success to user, but log the error
      // In production, you might want to handle this differently
    }
    
    // Also log to console for development/debugging
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
      message: 'Failed to send OTP'
    });
  }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', apiLimiter, async (req, res) => {
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
    
    // Update user as verified
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user && !user.isVerified) {
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();
    }
    
    // Set session
    req.session.email = email.toLowerCase().trim();
    req.session.verified = true;
    
    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        dailyLimit: user.getDailyLimit()
      }
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
});

// Get session info
app.get('/api/auth/session', extractUser, async (req, res) => {
  try {
    if (!req.session || !req.session.email) {
      return res.json({
        success: true,
        authenticated: false
      });
    }
    
    const user = await User.findOne({ email: req.session.email });
    
    if (!user) {
      return res.json({
        success: true,
        authenticated: false
      });
    }
    
    // Get today's usage
    const usage = await Usage.getTodayUsage(user.email);
    
    res.json({
      success: true,
      authenticated: true,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        hasSubscription: user.hasActiveSubscription(),
        dailyLimit: user.getDailyLimit()
      },
      usage: {
        current: usage.count,
        limit: user.getDailyLimit(),
        remaining: Math.max(0, user.getDailyLimit() - usage.count)
      }
    });
    
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      message: 'Session check failed'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Lead form submission endpoint
const { createOrUpdateContact } = require('./utils/hubspot');

app.post('/api/leads/submit', apiLimiter, async (req, res) => {
  try {
    const { email, firstName, lastName, company, phone, country, leadInterest } = req.body;
    
    // Validate required fields
    if (!email || !firstName || !lastName || !company || !country) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    console.log(`📝 Lead form submitted: ${email} - ${leadInterest}`);

    // Create or update user in database
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      user = new User({
        email: email.toLowerCase().trim(),
        firstName,
        lastName,
        company,
        phone: phone || '',
        country,
        isVerified: false
      });
      await user.save();
      console.log(`✅ New user created from lead form: ${email}`);
    } else {
      // Update existing user with new information
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.company = company || user.company;
      user.phone = phone || user.phone;
      user.country = country || user.country;
      await user.save();
      console.log(`✅ Existing user updated from lead form: ${email}`);
    }

    // Sync with HubSpot
    const hubspotResult = await createOrUpdateContact({
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      company,
      phone: phone || '',
      country,
      leadInterest
    });

    if (hubspotResult.success) {
      // Update user with HubSpot contact ID
      if (hubspotResult.contactId) {
        user.hubspotContactId = hubspotResult.contactId;
        await user.save();
      }
      
      console.log(`✅ Lead synced with HubSpot: ${email}`);
    } else {
      console.error(`⚠️ HubSpot sync failed for ${email}:`, hubspotResult.message);
      // Continue anyway - lead is saved in our database
    }

    res.json({
      success: true,
      message: 'Thank you! We will be in touch at the earliest.',
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

// Get user's analysis history
app.get('/api/analyses', extractUser, async (req, res) => {
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
});

module.exports = app;