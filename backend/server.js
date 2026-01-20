require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const rateLimit = require('express-rate-limit');

// Database
const connectDB = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const usageRoutes = require('./routes/usage');
// Add with other route imports (around line 14)
const subscriptionRoutes = require('./routes/subscription');
const statsRoutes = require('./routes/stats');
const Stats = require('./models/Stats');

// Middleware
const { requireAuth, checkUsageLimit, recordUsage } = require('./middleware/auth');

// Original analyzers and utils
const { fetchPage, normalizeUrl } = require('./utils');
const { analyzeTechnical } = require('./analyzers/technical');
const { analyzeContent } = require('./analyzers/content');
const { analyzeQueryMatch } = require('./analyzers/queryMatch');
const { analyzeVisibility } = require('./analyzers/visibility');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - CRITICAL for DigitalOcean
app.set('trust proxy', 1);
// ============================================================
// DATABASE CONNECTION
// ============================================================
connectDB();

// ============================================================
// MIDDLEWARE
// ============================================================

// Security - configure helmet to allow cross-origin cookies
app.use(helmet({
  contentSecurityPolicy: false,  // May interfere with inline scripts
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - Allow frontend domain with proper credentials support
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',  // Backend itself (for redirects/same-origin)
  'https://aeo.thatworkx.com',
  'https://tw-aeo-suite-app-aktwv.ondigitalocean.app',
  process.env.FRONTEND_URL
].filter(Boolean);  // Remove undefined/null

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Remove trailing slash for comparison
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => allowed === normalizedOrigin || allowed === origin)) {
      return callback(null, origin);
    }
    
    // For local development, allow any localhost origin
    if (normalizedOrigin.startsWith('http://localhost:')) {
      return callback(null, origin);
    }
    
    console.log('[CORS] Blocked origin:', origin);
    return callback(new Error('CORS not allowed'), false);
  },
  credentials: true,  // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Determine if running in production
// Set NODE_ENV=production in DigitalOcean environment variables
const isProduction = process.env.NODE_ENV === 'production';

console.log('[Server] Starting with config:', {
  NODE_ENV: process.env.NODE_ENV || 'not set',
  isProduction,
  PORT: process.env.PORT
});

// Session management
// - Local: proxy handles same-origin, so sameSite: 'lax' works
// - Production: cross-origin needs sameSite: 'none' + secure: true
app.use(session({
  name: 'aeo.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  proxy: isProduction,  // Trust proxy in production (DigitalOcean)
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600,
  }),
  cookie: {
    secure: isProduction,                      // true for HTTPS in production, false for HTTP locally
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,          // 7 days
    sameSite: isProduction ? 'none' : 'lax',  // 'none' for cross-origin in production
    path: '/',
  },
}));

// Debug logging for session (can be removed later)
app.use((req, res, next) => {
  if (req.path.includes('/auth') || req.path.includes('/technical') || req.path.includes('/content') || req.path.includes('/query') || req.path.includes('/visibility')) {
    console.log(`[${req.method}] ${req.path}`, {
      sessionID: req.sessionID?.substring(0, 8) + '...',
      userId: req.session?.userId || 'none',
      cookie: req.headers.cookie ? 'present' : 'missing'
    });
  }
  next();
});

// Rate limiting (general)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
});
app.use('/', limiter);

// ============================================================
// API PREFIX MIDDLEWARE
// Strips /api prefix for local development compatibility
// In production, DigitalOcean's ingress already strips it
// ============================================================
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    req.url = req.url.replace('/api', '');
  }
  next();
});

// ============================================================
// ROUTES
// ============================================================

// Auth routes (lead capture, OTP, session)
app.use('/auth', authRoutes);

// Usage routes (limits, history, email reports)
app.use('/usage', usageRoutes);

// Add with other route registration (around line 85)
app.use('/subscription', subscriptionRoutes);

// Stats route (public - no auth)
app.use('/stats', statsRoutes);

// ============================================================
// ANALYSIS ENDPOINTS (Protected with auth and limits)
// ============================================================

/**
 * TOOL 1: Technical AEO Audit
 */
app.post('/technical', 
  requireAuth, 
  checkUsageLimit('technical'),
  recordUsage('technical'),
  async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const targetUrl = normalizeUrl(url);
      console.log(`\n[Technical Audit] ${targetUrl}`);
      
      const { $ } = await fetchPage(targetUrl);
      const results = analyzeTechnical($, targetUrl);
      
      console.log(`[Technical Audit] Complete. Score: ${results.overallScore}/100`);
      
      // Increment stats counter
      Stats.incrementAnalyses().catch(err => console.error('Stats tracking error:', err));
      res.json({
        tool: 'Technical AEO Audit',
        url: targetUrl,
        analyzedAt: new Date().toISOString(),
        ...results,
      });

    } catch (error) {
      console.error('[Technical Audit] Error:', error.message);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      let statusCode = 500;
      
      if (error.code === 'ENOTFOUND') {
        errorMessage = 'Unable to find this website. Please check the URL is correct and the site is online.';
        statusCode = 400;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMessage = 'The website took too long to respond. Please try again.';
        statusCode = 504;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. The website may be down or blocking requests.';
        statusCode = 503;
      }
      
      res.status(statusCode).json({ 
        error: 'Analysis failed',
        message: errorMessage,
        url 
      });
    }
  }
);

/**
 * TOOL 2: Content Quality Analyzer
 */
app.post('/content', 
  requireAuth, 
  checkUsageLimit('content'),
  recordUsage('content'),
  async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const targetUrl = normalizeUrl(url);
      console.log(`\n[Content Analysis] ${targetUrl}`);
      
      const { $ } = await fetchPage(targetUrl);
      const results = analyzeContent($, targetUrl);
      
      console.log(`[Content Analysis] Complete. Score: ${results.overallScore}/100`);
      
      Stats.incrementAnalyses().catch(err => console.error('Stats error:', err));

      // Increment stats counter
      Stats.incrementAnalyses().catch(err => console.error('Stats tracking error:', err));

      res.json({
        tool: 'Content Quality Analyzer',
        url: targetUrl,
        analyzedAt: new Date().toISOString(),
        ...results,
      });

    } catch (error) {
      console.error('[Content Analysis] Error:', error.message);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      let statusCode = 500;
      
      if (error.code === 'ENOTFOUND') {
        errorMessage = 'Unable to find this website. Please check the URL is correct and the site is online.';
        statusCode = 400;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMessage = 'The website took too long to respond. Please try again.';
        statusCode = 504;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. The website may be down or blocking requests.';
        statusCode = 503;
      }
      
      res.status(statusCode).json({ 
        error: 'Analysis failed',
        message: errorMessage,
        url 
      });
    }
    
  }
);

/**
 * TOOL 3: Query Match Analyzer
 */
app.post('/query-match', 
  requireAuth, 
  checkUsageLimit('query-match'),
  recordUsage('query-match'),
  async (req, res) => {
    const { url, queries } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: 'At least one query is required' });
    }

    const targetQueries = queries.slice(0, 10).map(q => q.trim()).filter(q => q.length > 0);
    
    if (targetQueries.length === 0) {
      return res.status(400).json({ error: 'At least one valid query is required' });
    }

    try {
      const targetUrl = normalizeUrl(url);
      console.log(`\n[Query Match] ${targetUrl}`);
      
      const { $ } = await fetchPage(targetUrl);
      const results = analyzeQueryMatch($, targetUrl, targetQueries);
      
      console.log(`[Query Match] Complete. Overall Match: ${results.overallScore}/100`);
      
      // Increment stats counter
      Stats.incrementAnalyses().catch(err => console.error('Stats tracking error:', err));
      res.json({
        tool: 'Query Match Analyzer',
        url: targetUrl,
        analyzedAt: new Date().toISOString(),
        ...results,
      });

    } catch (error) {
      console.error('[Query Match] Error:', error.message);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      let statusCode = 500;
      
      if (error.code === 'ENOTFOUND') {
        errorMessage = 'Unable to find this website. Please check the URL is correct and the site is online.';
        statusCode = 400;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMessage = 'The website took too long to respond. Please try again.';
        statusCode = 504;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. The website may be down or blocking requests.';
        statusCode = 503;
      }
      
      res.status(statusCode).json({ 
        error: 'Analysis failed',
        message: errorMessage,
        url 
      });
    }

  }
);

/**
 * TOOL 4: AI Visibility Checker
 */
app.post('/visibility', 
  requireAuth, 
  checkUsageLimit('visibility'),
  recordUsage('visibility'),
  async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const targetUrl = normalizeUrl(url);
      console.log(`\n[Visibility Check] ${targetUrl}`);
      
      const { $ } = await fetchPage(targetUrl);
      const results = analyzeVisibility($, targetUrl);
      
      console.log(`[Visibility Check] Complete. Score: ${results.overallScore}/100`);
      
      // Increment stats counter
      Stats.incrementAnalyses().catch(err => console.error('Stats tracking error:', err));
      
      res.json({
        tool: 'AI Visibility Checker',
        url: targetUrl,
        analyzedAt: new Date().toISOString(),
        ...results,
      });

    } catch (error) {
      console.error('[Visibility Check] Error:', error.message);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      let statusCode = 500;
      
      if (error.code === 'ENOTFOUND') {
        errorMessage = 'Unable to find this website. Please check the URL is correct and the site is online.';
        statusCode = 400;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMessage = 'The website took too long to respond. Please try again.';
        statusCode = 504;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. The website may be down or blocking requests.';
        statusCode = 503;
      }
      
      res.status(statusCode).json({ 
        error: 'Analysis failed',
        message: errorMessage,
        url 
      });
    }

  }
);

// ============================================================
// Health check
// ============================================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Session debug endpoint
app.get('/session-debug', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    hasSession: !!req.session,
    sessionData: {
      userId: req.session?.userId || null,
      email: req.session?.email || null,
      verified: req.session?.verified || false
    },
    cookieReceived: !!req.headers.cookie,
    cookieName: req.headers.cookie ? req.headers.cookie.split(';').find(c => c.trim().startsWith('aeo.sid')) : null,
    isProduction: process.env.NODE_ENV === 'production',
    origin: req.headers.origin
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'AEO Audit Suite API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      auth: [
        'POST /api/auth/submit-lead',
        'POST /api/auth/verify-otp',
        'POST /api/auth/resend-otp',
        'GET /api/auth/session',
        'POST /api/auth/logout',
      ],
      usage: [
        'GET /api/usage/limits',
        'GET /api/usage/history',
        'POST /api/usage/email-report',
      ],
      tools: [
        'POST /api/technical',
        'POST /api/content',
        'POST /api/query-match',
        'POST /api/visibility',
      ],
    },
  });
});

// ============================================================
// Error handling
// ============================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================
// Start server
// ============================================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     AEO AUDIT SUITE v2.0                       ║
║            Backend Server with Lead Capture & Auth             ║
╠════════════════════════════════════════════════════════════════╣
║  Running on: http://localhost:${PORT}                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}                                       ║
╠════════════════════════════════════════════════════════════════╣
║  🔐 Authentication Endpoints:                                  ║
║     POST /api/auth/submit-lead     - Submit lead & get OTP     ║
║     POST /api/auth/verify-otp      - Verify OTP & login        ║
║     POST /api/auth/resend-otp      - Resend OTP                ║
║     GET  /api/auth/session         - Check session status      ║
║     POST /api/auth/logout          - Logout                    ║
║                                                                ║
║  📊 Usage Endpoints:                                           ║
║     GET  /api/usage/limits         - Check daily limits        ║
║     GET  /api/usage/history        - Get usage history         ║
║     POST /api/usage/email-report   - Email report to user      ║
║                                                                ║
║  🔧 Analysis Tools (Protected):                                ║
║     POST /api/technical            - Technical AEO Audit       ║
║     POST /api/content              - Content Quality Analyzer  ║
║     POST /api/query-match          - Query Match Analyzer      ║
║     POST /api/visibility           - AI Visibility Checker     ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;