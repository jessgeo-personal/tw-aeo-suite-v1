import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Target, TrendingUp, Award } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 text-white">
        <div className="container mx-auto px-6 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <Award className="w-4 h-4 mr-2" />
              Professional AEO Audit Suite
            </div>
            
            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Optimize for the Future of Search
            </h1>
            
            {/* Subheading */}
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Comprehensive AEO audits to help your website rank in AI-powered search engines like ChatGPT, Perplexity, and Google AI Overviews
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/signup"
                className="px-8 py-4 bg-accent-orange-500 hover:bg-accent-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-lg"
              >
                Start Free Audit
              </Link>
              <Link 
                to="/login"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg border-2 border-white/30 transition-all text-lg"
              >
                Sign In
              </Link>
            </div>
            
            {/* Trust Badge */}
            <p className="mt-8 text-sm text-blue-200">
              By Thatworkx Solutions • Trusted by marketing professionals
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Four Powerful Analysis Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get comprehensive insights into your website's AI search visibility
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Technical Audit */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Technical Audit
              </h3>
              <p className="text-gray-600 mb-4">
                Analyze schema markup, crawlability, and HTML structure for AI compatibility
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  Schema markup detection
                </li>
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  Crawlability assessment
                </li>
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  HTML structure analysis
                </li>
              </ul>
            </div>

            {/* Content Quality */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-accent-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-accent-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Content Quality
              </h3>
              <p className="text-gray-600 mb-4">
                Evaluate readability, Q&A patterns, and citation-worthiness of your content
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  Readability scoring
                </li>
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  Q&A pattern detection
                </li>
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  Citation-worthy content
                </li>
              </ul>
            </div>

            {/* Query Match */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-accent-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-accent-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Query Match
              </h3>
              <p className="text-gray-600 mb-4">
                See how well your page aligns with target queries and search intent
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  Keyword relevance
                </li>
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  Intent matching
                </li>
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  Query optimization tips
                </li>
              </ul>
            </div>

            {/* AI Visibility */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI Visibility
              </h3>
              <p className="text-gray-600 mb-4">
                Overall assessment of your citation potential in AI search results
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  Authority signals
                </li>
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  Citation potential
                </li>
                <li className="flex items-start">
                  <span className="text-accent-green-500 mr-2">✓</span>
                  Actionable recommendations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-900 to-primary-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Optimize for AI Search?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join marketing professionals who are future-proofing their SEO strategy
          </p>
          <Link 
            to="/signup"
            className="inline-block px-8 py-4 bg-accent-orange-500 hover:bg-accent-orange-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-lg"
          >
            Start Your Free Audit Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <img 
                src="https://thatworkx.com/wp-content/uploads/2025/04/cropped-cropped-thatworkx-logo-v1-21Apr2025-Logo-e1745303085637.png"
                alt="Thatworkx Solutions" 
                className="h-8 w-auto mb-4 brightness-200"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div 
                className="hidden text-xl font-bold text-white mb-4"
                style={{ display: 'none' }}
              >
                Thatworkx Solutions
              </div>
              <p className="text-sm text-gray-400">
                Solutions that work.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>Meydan FZ, Dubai, UAE</li>
                <li>
                  <a href="tel:+971529342175" className="hover:text-accent-orange-500 transition-colors">
                    +971 52 934 2175
                  </a>
                </li>
                <li>
                  <a href="mailto:info@thatworkx.com" className="hover:text-accent-orange-500 transition-colors">
                    info@thatworkx.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="https://thatworkx.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent-orange-500 transition-colors">
                    Main Website
                  </a>
                </li>
                <li>
                  <a href="https://thatworkx.com/contact-us/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-orange-500 transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="https://thatworkx.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-orange-500 transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Thatworkx Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
