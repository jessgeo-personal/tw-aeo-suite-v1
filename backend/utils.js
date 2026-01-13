const fetch = require('node-fetch');
const cheerio = require('cheerio');

// Fetch a webpage with proper headers and timeout
async function fetchPage(url, timeout = 30000) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  
  return { html, $, response };
}

// Extract all schema markup from a page
function extractSchemas($) {
  const schemas = [];
  const schemaTypes = [];
  
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const content = $(el).html();
      const parsed = JSON.parse(content);
      schemas.push(parsed);
      
      const extractTypes = (obj) => {
        if (Array.isArray(obj)) {
          obj.forEach(extractTypes);
        } else if (obj && typeof obj === 'object') {
          if (obj['@type']) {
            const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
            schemaTypes.push(...types);
          }
          if (obj['@graph']) extractTypes(obj['@graph']);
          if (obj.mainEntity) extractTypes(obj.mainEntity);
        }
      };
      extractTypes(parsed);
    } catch (e) {
      // Invalid JSON-LD, skip
    }
  });

  return { schemas, schemaTypes: [...new Set(schemaTypes)] };
}

// Extract meta tags
function extractMeta($) {
  return {
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    keywords: $('meta[name="keywords"]').attr('content') || '',
    canonical: $('link[rel="canonical"]').attr('href') || '',
    robots: $('meta[name="robots"]').attr('content') || '',
    ogTitle: $('meta[property="og:title"]').attr('content') || '',
    ogDescription: $('meta[property="og:description"]').attr('content') || '',
    ogImage: $('meta[property="og:image"]').attr('content') || '',
    ogType: $('meta[property="og:type"]').attr('content') || '',
    twitterCard: $('meta[name="twitter:card"]').attr('content') || '',
    twitterTitle: $('meta[name="twitter:title"]').attr('content') || '',
    twitterDescription: $('meta[name="twitter:description"]').attr('content') || '',
    author: $('meta[name="author"]').attr('content') || '',
    publishedTime: $('meta[property="article:published_time"]').attr('content') || '',
    modifiedTime: $('meta[property="article:modified_time"]').attr('content') || '',
  };
}

// Extract content structure
function extractContent($) {
  // Get body text (excluding scripts/styles)
  const bodyText = $('body').clone()
    .find('script, style, noscript').remove().end()
    .text().replace(/\s+/g, ' ').trim();
  
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

  // Headers
  const headers = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
    $(tag).each((i, el) => {
      const text = $(el).text().trim();
      if (text) headers[tag].push(text);
    });
  });

  // Paragraphs
  const paragraphs = [];
  $('p').each((i, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 20) paragraphs.push(text);
  });

  // Lists
  const lists = { ordered: 0, unordered: 0, items: 0 };
  lists.ordered = $('ol').length;
  lists.unordered = $('ul').length;
  lists.items = $('li').length;

  // Tables
  const tables = $('table').length;

  // Links
  const links = { internal: 0, external: 0, nofollow: 0 };
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href') || '';
    const rel = $(el).attr('rel') || '';
    if (rel.includes('nofollow')) links.nofollow++;
    if (href.startsWith('/') || href.startsWith('#')) {
      links.internal++;
    } else if (href.startsWith('http')) {
      links.external++;
    }
  });

  // Images
  const images = { total: 0, withAlt: 0, withTitle: 0 };
  $('img').each((i, el) => {
    images.total++;
    if ($(el).attr('alt')?.trim()) images.withAlt++;
    if ($(el).attr('title')?.trim()) images.withTitle++;
  });

  return {
    wordCount,
    headers,
    paragraphs,
    paragraphCount: paragraphs.length,
    lists,
    tables,
    links,
    images,
    bodyText,
  };
}

// Identify question-style content
function findQuestionContent($, content) {
  const questionPatterns = /^(what|how|why|when|where|who|which|can|does|is|are|will|should|could|would)\b/i;
  
  const questionHeaders = [];
  [...content.headers.h1, ...content.headers.h2, ...content.headers.h3].forEach(h => {
    if (questionPatterns.test(h) || h.includes('?')) {
      questionHeaders.push(h);
    }
  });

  // Look for FAQ patterns in content
  const faqIndicators = {
    hasFAQText: /faq|frequently asked|common questions|q\s*&\s*a/i.test(content.bodyText),
    hasQuestionHeaders: questionHeaders.length,
    questionHeaders: questionHeaders.slice(0, 10),
  };

  return faqIndicators;
}

// Calculate readability metrics
function calculateReadability(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);

  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;

  // Flesch Reading Ease (higher = easier)
  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  // Flesch-Kincaid Grade Level
  const gradeLevel = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;

  return {
    sentenceCount: sentences.length,
    wordCount: words.length,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    fleschScore: Math.round(Math.max(0, Math.min(100, fleschScore))),
    gradeLevel: Math.round(Math.max(0, gradeLevel) * 10) / 10,
    readabilityLevel: getReadabilityLevel(fleschScore),
  };
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function getReadabilityLevel(score) {
  if (score >= 90) return 'Very Easy (5th grade)';
  if (score >= 80) return 'Easy (6th grade)';
  if (score >= 70) return 'Fairly Easy (7th grade)';
  if (score >= 60) return 'Standard (8th-9th grade)';
  if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
  if (score >= 30) return 'Difficult (College)';
  return 'Very Difficult (Graduate)';
}

// Normalize URL
function normalizeUrl(url) {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  return normalized;
}

module.exports = {
  fetchPage,
  extractSchemas,
  extractMeta,
  extractContent,
  findQuestionContent,
  calculateReadability,
  normalizeUrl,
};
