// Test SSL/TLS fix for fetchPage function
require('dotenv').config();
const { fetchPage } = require('./utils');

const testUrls = [
  'https://thatworkx.com',
  'https://www.google.com',
  'https://example.com',
];

async function testFetch() {
  console.log('Testing fetchPage with improved SSL/TLS handling...\n');
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const { $, response } = await fetchPage(url);
      const title = $('title').text().trim();
      console.log(`✅ SUCCESS - Status: ${response.status}, Title: ${title}\n`);
    } catch (error) {
      console.log(`❌ FAILED - ${error.message}\n`);
    }
  }
}

testFetch();