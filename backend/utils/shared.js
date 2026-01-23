const cheerio = require('cheerio');

/**
 * Shared utility functions for all analyzers
 */

// Calculate grade based on score
function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Extract text content from HTML
function extractText($, selector) {
  return $(selector).text().trim();
}

// Extract all text from element
function getAllText($, selector) {
  return $(selector).map((i, el) => $(el).text().trim()).get();
}

// Count occurrences of keywords in text
function countKeywords(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return 0;
  
  const lowerText = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    const regex = new RegExp(`\\b${lowerKeyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
}

// Calculate reading time (words per minute = 200)
function calculateReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

// Calculate Flesch reading ease score
function calculateFleschScore(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.trim().split(/\s+/).length;
  const syllables = countSyllables(text);
  
  if (sentences === 0 || words === 0) return 0;
  
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, score));
}

// Count syllables in text (simplified)
function countSyllables(text) {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  return words.reduce((count, word) => {
    return count + countWordSyllables(word);
  }, 0);
}

function countWordSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// Check if URL is valid
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

// Find structured data (JSON-LD, microdata, etc.)
function findStructuredData($) {
  const jsonLd = [];
  
  $('script[type="application/ld+json"]').each((i, elem) => {
    try {
      const data = JSON.parse($(elem).html());
      jsonLd.push(data);
    } catch (e) {
      // Invalid JSON-LD, skip
    }
  });
  
  return jsonLd;
}

// Check for specific schema types
function hasSchemaType($, type) {
  const structuredData = findStructuredData($);
  return structuredData.some(data => {
    if (data['@type'] === type) return true;
    if (data['@graph']) {
      return data['@graph'].some(item => item['@type'] === type);
    }
    return false;
  });
}

// Extract meta tag content
function getMetaContent($, name) {
  return $(`meta[name="${name}"], meta[property="${name}"]`).attr('content') || '';
}

// Check if page has specific element
function hasElement($, selector) {
  return $(selector).length > 0;
}

// Get element count
function countElements($, selector) {
  return $(selector).length;
}

// Extract attribute from element
function getAttribute($, selector, attr) {
  return $(selector).attr(attr) || '';
}

// Check if text contains any of the patterns
function containsPattern(text, patterns) {
  return patterns.some(pattern => {
    const regex = new RegExp(pattern, 'i');
    return regex.test(text);
  });
}

// Calculate percentage
function percentage(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Normalize score to 0-100
function normalizeScore(score, max) {
  return Math.round((score / max) * 100);
}

module.exports = {
  getGrade,
  extractText,
  getAllText,
  countKeywords,
  calculateReadingTime,
  calculateFleschScore,
  countSyllables,
  isValidUrl,
  extractDomain,
  findStructuredData,
  hasSchemaType,
  getMetaContent,
  hasElement,
  countElements,
  getAttribute,
  containsPattern,
  percentage,
  normalizeScore
};
