const express = require('express');
const cors = require('cors');

// Original analyzers and utils
const { fetchPage, normalizeUrl } = require('./utils');
const { analyzeTechnical } = require('./analyzers/technical');
const { analyzeContent } = require('./analyzers/content');
const { analyzeQueryMatch } = require('./analyzers/queryMatch');
const { analyzeVisibility } = require('./analyzers/visibility');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ANALYSIS ENDPOINTS (No Auth Required - Testing Mode)
// ============================================================

/**
 * TOOL 1: Technical AEO Audit
 */
app.post('/api/technical', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const targetUrl = normalizeUrl(url);
    console.log(`\n[Technical Audit] Analyzing: ${targetUrl}`);
    
    const { $ } = await fetchPage(targetUrl);
    const results = analyzeTechnical($, targetUrl);
    
    console.log(`[Technical Audit] Complete. Score: ${results.overallScore}/100`);
    
    res.json({
      tool: 'Technical AEO Audit',
      url: targetUrl,
      analyzedAt: new Date().toISOString(),
      ...results,
    });

  } catch (error) {
    console.error('[Technical Audit] Error:', error.message);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message,
      url 
    });
  }
});

/**
 * TOOL 2: Content Quality Analyzer
 */
app.post('/api/content', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const targetUrl = normalizeUrl(url);
    console.log(`\n[Content Analysis] Analyzing: ${targetUrl}`);
    
    const { $ } = await fetchPage(targetUrl);
    const results = analyzeContent($, targetUrl);
    
    console.log(`[Content Analysis] Complete. Score: ${results.overallScore}/100`);
    
    res.json({
      tool: 'Content Quality Analyzer',
      url: targetUrl,
      analyzedAt: new Date().toISOString(),
      ...results,
    });

  } catch (error) {
    console.error('[Content Analysis] Error:', error.message);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message,
      url 
    });
  }
});

/**
 * TOOL 3: Query Match Analyzer
 */
app.post('/api/query-match', async (req, res) => {
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
    console.log(`\n[Query Match] Analyzing: ${targetUrl}`);
    console.log(`[Query Match] Queries: ${targetQueries.join(', ')}`);
    
    const { $ } = await fetchPage(targetUrl);
    const results = analyzeQueryMatch($, targetUrl, targetQueries);
    
    console.log(`[Query Match] Complete. Overall Match: ${results.overallScore}/100`);
    
    res.json({
      tool: 'Query Match Analyzer',
      url: targetUrl,
      analyzedAt: new Date().toISOString(),
      ...results,
    });

  } catch (error) {
    console.error('[Query Match] Error:', error.message);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message,
      url 
    });
  }
});

/**
 * TOOL 4: AI Visibility Checker
 */
app.post('/api/visibility', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const targetUrl = normalizeUrl(url);
    console.log(`\n[Visibility Check] Analyzing: ${targetUrl}`);
    
    const { $ } = await fetchPage(targetUrl);
    const results = analyzeVisibility($, targetUrl);
    
    console.log(`[Visibility Check] Complete. Score: ${results.overallScore}/100`);
    
    res.json({
      tool: 'AI Visibility Checker',
      url: targetUrl,
      analyzedAt: new Date().toISOString(),
      ...results,
    });

  } catch (error) {
    console.error('[Visibility Check] Error:', error.message);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message,
      url 
    });
  }
});

// ============================================================
// Health check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: 'testing',
    note: 'Running without authentication - for testing only'
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'AEO Audit Suite API',
    version: '2.0.0-testing',
    status: 'running',
    mode: 'NO AUTH - Testing Mode',
    note: 'Authentication and database disabled for testing',
    endpoints: {
      tools: [
        'POST /api/technical - Technical AEO Audit',
        'POST /api/content - Content Quality Analyzer',
        'POST /api/query-match - Query Match Analyzer',
        'POST /api/visibility - AI Visibility Checker',
      ],
    },
  });
});

// ============================================================
// Start server
// ============================================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  AEO AUDIT SUITE - TESTING MODE                ║
║                    (No Auth / No Database)                     ║
╠════════════════════════════════════════════════════════════════╣
║  Running on: http://localhost:${PORT}                            ║
║  Mode: TESTING (Auth disabled for immediate testing)          ║
╠════════════════════════════════════════════════════════════════╣
║  🔧 Analysis Tools (Unrestricted):                             ║
║     POST /api/technical            - Technical AEO Audit       ║
║     POST /api/content              - Content Quality Analyzer  ║
║     POST /api/query-match          - Query Match Analyzer      ║
║     POST /api/visibility           - AI Visibility Checker     ║
║                                                                ║
║  💡 Test it now:                                               ║
║     Open your frontend or use Postman/curl                     ║
║     All endpoints work without authentication                  ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
