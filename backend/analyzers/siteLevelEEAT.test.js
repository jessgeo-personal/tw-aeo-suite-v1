const { analyzeSiteLevelEEAT } = require('./siteLevelEEAT');
const { fetchPage } = require('../utils/pageFetcher');
const axios = require('axios');

// Mock dependencies
jest.mock('../utils/pageFetcher');
jest.mock('whois-json', () => jest.fn());
jest.mock('axios');

const whois = require('whois-json');

describe('Site-Level EEAT Analyzer', () => {
  const domain = 'aeo.thatworkx.com';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect Organization schema inside a @graph structure', async () => {
    const mockHtml = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "name": "Thatworkx Solutions"
          }
        ]
      }
      </script>
    `;
    const $ = require('cheerio').load(mockHtml);
    fetchPage.mockResolvedValue({ $ });
    
    // Mock WHOIS success
    whois.mockResolvedValue({ creationDate: '2020-01-01T00:00:00Z' });
    
    // Mock key pages success
    axios.get.mockResolvedValue({ status: 200 });

    const result = await analyzeSiteLevelEEAT(domain);
    
    expect(result.findings.trustSignals.details.hasOrganizationSchema).toBe(true);
    expect(result.findings.domainAge.score).toBeGreaterThan(10); // Should be > 10 for established domain
  });

  it('should detect visible email from within JSON-LD metadata as fallback', async () => {
    const mockHtml = `
      <script type="application/ld+json">
      {
        "@type": "Organization",
        "email": "support@thatworkx.com"
      }
      </script>
      <div id="root">SPA Content - No visible email in text</div>
    `;
    const $ = require('cheerio').load(mockHtml);
    fetchPage.mockResolvedValue({ $ });
    whois.mockResolvedValue({ creationDate: '2020-01-01' });
    axios.get.mockResolvedValue({ status: 200 });

    const result = await analyzeSiteLevelEEAT(domain);
    
    expect(result.findings.trustSignals.details.hasVisibleEmail).toBe(true);
  });

  it('should handle WHOIS failure with a probabilistic ±10 point margin', async () => {
    const $ = require('cheerio').load('<html></html>');
    fetchPage.mockResolvedValue({ $ });
    
    // Mock WHOIS failure (timeout or error)
    whois.mockRejectedValue(new Error('Timeout'));
    
    axios.get.mockResolvedValue({ status: 200 });

    const result = await analyzeSiteLevelEEAT(domain);
    
    expect(result.findings.domainAge.details.ageEstimate).toContain('±10');
    expect(result.recommendations.some(r => r.text.includes('±10'))).toBe(true);
  });
});
