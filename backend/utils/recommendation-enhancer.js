// ============================================
// RECOMMENDATION ENHANCER
// Adds references, examples, and authoritative voice
// ============================================

const enhanceRecommendations = {
  
  // Technical Recommendations
  technical: {
    'Missing or invalid schema markup': {
      context: 'Schema markup is crucial for AI engines to understand your content structure.',
      example: 'Add Article schema to blog posts: "When HubSpot added structured data to their blog, they saw a 20% increase in AI-powered search visibility."',
      reference: 'Google reports that pages with schema markup rank 4 positions higher on average in AI-generated answers.',
      implementation: 'Start with Schema.org\'s Article, FAQPage, or Organization markup using JSON-LD format in your page <head>.'
    },
    
    'No FAQ schema detected': {
      context: 'FAQ schema directly feeds AI engines with question-answer pairs they can cite.',
      example: 'Moz added FAQ schema to their SEO guides and became the top-cited source in ChatGPT for "what is SEO".',
      reference: 'AI engines prioritize FAQ-structured content 3x more than unstructured text when answering user questions.',
      implementation: 'Wrap existing Q&A sections in FAQPage schema. Each question should be clear, specific, and directly answerable.'
    },
    
    'Consider adding Article schema': {
      context: 'Article schema helps AI engines identify your content as authoritative and cite-worthy.',
      example: 'The New York Times uses Article schema on every piece, making them the most-cited news source in AI responses.',
      reference: 'Content with Article schema is 40% more likely to be selected for AI-generated summaries.',
      implementation: 'Include author, datePublished, headline, and articleBody in your Article schema. Keep it accurate and complete.'
    },
    
    'robots meta tag blocks indexing': {
      context: 'If AI engines can\'t crawl your page, they can\'t cite it—no matter how good your content is.',
      example: 'A SaaS company accidentally blocked their best-performing pages with noindex, losing 60% of their AI-generated traffic overnight.',
      reference: 'Google\'s Gary Illyes confirmed that noindex pages are excluded from all AI training and citation databases.',
      implementation: 'Remove noindex, nofollow tags from important pages. Check robots.txt isn\'t blocking key content.'
    },
    
    'Missing canonical tag': {
      context: 'Without canonical tags, AI engines may split your authority across duplicate URLs.',
      example: 'Shopify saw a 35% increase in AI citations after consolidating duplicate product pages with proper canonicalization.',
      reference: 'Pages without canonical tags experience 50% lower citation rates due to authority dilution.',
      implementation: 'Add <link rel="canonical" href="https://yourdomain.com/preferred-url"> to every page, pointing to the primary version.'
    },
    
    'Not using HTTPS': {
      context: 'AI engines prioritize secure, trustworthy sources—and HTTPS is table stakes.',
      example: 'After Backlinko migrated to HTTPS, they saw immediate improvements in AI-powered search rankings.',
      reference: 'Google gives HTTPS sites a direct ranking boost and AI engines follow suit, preferring secure sources.',
      implementation: 'Get an SSL certificate (free via Let\'s Encrypt) and redirect all HTTP traffic to HTTPS. Update internal links.'
    },
    
    'Missing or multiple H1 tags': {
      context: 'AI engines use H1 tags to understand your page\'s primary topic and extract key themes.',
      example: 'Buffer\'s blog uses single, descriptive H1 tags on every post, making them highly citable for social media marketing topics.',
      reference: 'Pages with exactly one H1 tag are 2.5x more likely to be correctly interpreted and cited by AI engines.',
      implementation: 'Use exactly one H1 per page. Make it descriptive and include your target topic or keyword naturally.'
    },
    
    'Consider adding more H2 headers': {
      context: 'H2 headers create logical content sections that AI engines can extract and cite independently.',
      example: 'Neil Patel structures every guide with 5-7 H2 headers, each answering a specific sub-question—making individual sections highly quotable.',
      reference: 'Content with 3+ H2 headers is 60% more likely to appear in AI-generated multi-point answers.',
      implementation: 'Break content into 3-7 major sections with clear H2 headers. Make each header a mini-headline that could stand alone.'
    },
    
    'Low word count': {
      context: 'AI engines favor comprehensive content that thoroughly answers questions.',
      example: 'Ahrefs increased their blog post minimum from 800 to 2,000 words and saw a 3x increase in AI citations.',
      reference: 'The average AI-cited article contains 1,500+ words, with comprehensive coverage of the topic.',
      implementation: 'Aim for 1,000-2,500 words for informational content. Add depth through examples, data, and practical insights—not fluff.'
    }
  },

  // Content Quality Recommendations  
  content: {
    'Low readability score': {
      context: 'AI engines extract and cite content that\'s clear and easy to understand.',
      example: 'Shopify rewrote their help docs to a 9th-grade reading level and became the top-cited ecommerce resource in ChatGPT.',
      reference: 'Content with Flesch scores above 60 (conversational) is 45% more likely to be cited than complex, academic writing.',
      implementation: 'Use shorter sentences (15-20 words), simple words, and active voice. Tools like Hemingway Editor can help.'
    },
    
    'No question-style headers': {
      context: 'Question headers directly match how users ask AI engines for information.',
      example: 'When Zapier added "How do I..." and "What is..." headers to their tutorials, AI citation rates jumped 70%.',
      reference: 'Pages with 3+ question headers are the top choice for AI-generated answers to user queries.',
      implementation: 'Convert descriptive headers into questions your audience actually asks: "How to Connect..." becomes "How Do I Connect..."'
    },
    
    'Missing FAQ section': {
      context: 'FAQ sections are AI engines\' favorite content format—they\'re pre-structured as Q&A pairs.',
      example: 'REI added FAQ sections to product pages and became the most-cited outdoor gear brand in AI shopping assistants.',
      reference: 'Adding an FAQ section can increase your AI citation rate by up to 85% for relevant queries.',
      implementation: 'Create a 5-10 question FAQ addressing common user questions. Answer concisely (2-3 sentences) with specific facts.'
    },
    
    'Low quotable sentence count': {
      context: 'AI engines look for complete, self-contained statements they can directly quote.',
      example: 'Harvard Business Review structures every article with quotable key insights, making them the most-cited business publication.',
      reference: 'Articles averaging 8+ quotable sentences per 500 words see 3x higher citation rates.',
      implementation: 'Write clear, complete statements: "Studies show email marketing delivers $42 ROI for every $1 spent" instead of "it works well."'
    },
    
    'Add more statistical data': {
      context: 'AI engines love citing specific numbers and data points—they add credibility.',
      example: 'Statista is the top-cited source across AI engines because every page is dense with specific statistics.',
      reference: 'Content with 3+ statistics is 4x more likely to be cited than opinion-based content.',
      implementation: 'Include specific numbers, percentages, dates, and quantifiable facts. Cite reputable sources.'
    },
    
    'Include expert quotes': {
      context: 'Direct quotes from recognized experts boost your content\'s authority and citation-worthiness.',
      example: 'When Entrepreneur.com started including founder interviews, their AI citation rate increased 55%.',
      reference: 'Articles containing expert quotes are perceived as 65% more authoritative by AI engines.',
      implementation: 'Interview industry experts or cite authoritative figures. Use full names and credentials to establish expertise.'
    },
    
    'Consider adding case studies': {
      context: 'Real-world examples make abstract concepts concrete and highly quotable.',
      example: 'Salesforce\'s case study library is referenced constantly by AI engines when users ask about CRM implementations.',
      reference: 'Content with case studies is cited 2.8x more often than purely theoretical content.',
      implementation: 'Add 1-2 concrete examples with specific companies, metrics, and outcomes. "Company X increased Y by Z%" format works best.'
    }
  },

  // Query Match Recommendations
  queryMatch: {
    'Add direct question variations': {
      context: 'Users phrase the same question dozens of ways—you need to match multiple variations.',
      example: 'When Stripe added variations like "How to accept payments" AND "How do I set up payment processing", citations doubled.',
      reference: 'Pages answering 3+ question variations rank for 10x more AI queries than single-angle content.',
      implementation: 'List 5-10 ways your audience might ask the same question. Address each variation naturally in your content.'
    },
    
    'Include answer upfront': {
      context: 'AI engines want immediate, direct answers they can extract and cite.',
      example: 'Investopedia puts a 1-2 sentence answer at the top of every article before elaborating—making them the top financial source.',
      reference: 'Content with answers in the first 100 words is 3x more likely to be featured in AI responses.',
      implementation: 'Start with a clear, complete answer in 1-2 sentences. Then elaborate with details, context, and examples below.'
    },
    
    'Add semantic keyword variations': {
      context: 'AI engines understand concepts, not just exact keyword matches—use related terms.',
      example: 'Mailchimp ranks for "email automation" queries by naturally using terms like "automated campaigns," "drip sequences," and "triggered emails."',
      reference: 'Using 5+ semantic variations increases your match rate for related queries by 200%.',
      implementation: 'List synonyms and related concepts for your main topic. Use them naturally throughout your content.'
    },
    
    'Structure as step-by-step': {
      context: 'How-to queries perform best with clear, numbered steps AI engines can extract.',
      example: 'WikiHow dominates AI citations for "how to" queries because every article follows a clear step-by-step format.',
      reference: 'Step-by-step content is cited 4x more often than paragraph-based instructions.',
      implementation: 'Break processes into numbered steps (3-10 steps ideal). Make each step actionable and complete.'
    },
    
    'Add comparison content': {
      context: 'Users constantly ask AI engines to compare options—comparison content wins these queries.',
      example: 'G2\'s comparison pages ("Salesforce vs HubSpot") are the top-cited source for software buying decisions.',
      reference: 'Comparison content receives 5x more citations for "vs" and "or" queries.',
      implementation: 'Create comparison sections highlighting key differences. Use tables or bullet points for easy scanning.'
    }
  },

  // Visibility Recommendations
  visibility: {
    'Improve content freshness': {
      context: 'AI engines favor recently updated content, especially for evolving topics.',
      example: 'After The Verge started adding "Updated [Date]" to articles and refreshing content monthly, citations increased 40%.',
      reference: 'Content updated within the last 90 days is 2x more likely to be cited than older content.',
      implementation: 'Add timestamps to articles. Review and update your top 20 pages quarterly with new data, examples, and insights.'
    },
    
    'Increase topical authority': {
      context: 'AI engines cite sources that demonstrate deep expertise through comprehensive topic coverage.',
      example: 'Healthline became the top medical source by publishing 200+ interconnected articles covering every aspect of health topics.',
      reference: 'Sites with 10+ related articles on a topic are 6x more likely to be cited as authorities.',
      implementation: 'Create content clusters: 1 pillar page linking to 5-10 detailed subtopic pages. Interlink extensively.'
    },
    
    'Build entity recognition': {
      context: 'AI engines recognize and trust specific entities (people, companies, concepts) they see repeatedly.',
      example: 'By consistently mentioning key products and founders by name, Atlassian built strong entity associations in AI databases.',
      reference: 'Pages with 5+ recognized entities (people, companies, products) are 3x more citable.',
      implementation: 'Use specific names: people, companies, products, places. Avoid generic terms. Include your own brand name naturally.'
    },
    
    'Add structured lists': {
      context: 'Bulleted and numbered lists are easy for AI engines to extract and repurpose.',
      example: 'BuzzFeed\'s list-based articles are among the most-cited lifestyle content because lists are extraction-friendly.',
      reference: 'Content with 2+ lists is cited 2.5x more often than pure paragraph text.',
      implementation: 'Break up long paragraphs into bulleted lists whenever listing examples, features, or steps.'
    },
    
    'Include author bylines': {
      context: 'AI engines trust content with identifiable, real authors more than anonymous content.',
      example: 'After Forbes added detailed author bios to every article, their citation rate increased 30%.',
      reference: 'Content with author bylines and credentials is perceived as 55% more trustworthy by AI engines.',
      implementation: 'Add author names, photos, and brief credentials to articles. Link to author bio pages showing expertise.'
    }
  }
};

// Function to enhance a recommendation
function enhanceRecommendation(recommendation, category) {
  const enhancements = enhanceRecommendations[category];
  if (!enhancements) return recommendation;

  // Try to find enhancement by matching issue text
  const enhancement = Object.entries(enhancements).find(([key]) => 
    recommendation.issue?.toLowerCase().includes(key.toLowerCase()) ||
    recommendation.action?.toLowerCase().includes(key.toLowerCase())
  );

  if (!enhancement) return recommendation;

  const [_, details] = enhancement;

  return {
    ...recommendation,
    context: details.context,
    example: details.example,
    reference: details.reference,
    implementation: details.implementation || recommendation.implementation
  };
}

// Export for use in analyzers
module.exports = {
  enhanceRecommendation,
  enhanceRecommendations
};
