import React from 'react';
import { X } from 'lucide-react';

/**
 * Fair Use Policy Modal
 * Displays the fair usage policy content
 * Content matches /public/fair-usage.html
 */
const FairUsePolicyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Fair Usage Policy</h3>
            <p className="text-sm text-gray-500">Last Updated: January 2026</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[65vh] text-sm text-gray-700 space-y-6">
          
          {/* Overview */}
          <section>
            <h4 className="font-bold text-gray-900 text-base mb-2">Overview</h4>
            <p>
              This Fair Usage Policy ensures that all users have access to reliable, high-quality 
              AEO analysis services. While we offer "unlimited" analyses for paid subscribers, 
              we maintain reasonable usage limits to prevent abuse and ensure optimal performance 
              for everyone.
            </p>
          </section>

          {/* Free Plan */}
          <section>
            <h4 className="font-bold text-gray-900 text-base mb-2">Free Plan Usage Limits</h4>
            <p className="mb-2"><strong>Daily Limits Per Tool:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600">
              <li>Technical Audit: 3 analyses per day</li>
              <li>Content Quality: 3 analyses per day</li>
              <li>Query Match: 3 analyses per day</li>
              <li>AI Visibility: 3 analyses per day</li>
            </ul>
            <p className="mt-3 text-gray-600">
              <strong>Reset Schedule:</strong> Limits reset daily at 12:00 AM Dubai time (UTC+4)
            </p>
            <p className="text-gray-600">
              <strong>Total:</strong> 12 page analyses per day across all tools
            </p>
            <p className="mt-2 text-gray-600">
              <strong>Additional Restrictions:</strong> Maximum 5 requests per minute (rate limiting), 
              Page analysis timeout: 30 seconds, Maximum URL length: 2048 characters
            </p>
          </section>

          {/* Unlimited Plan */}
          <section>
            <h4 className="font-bold text-gray-900 text-base mb-2">Unlimited Plan Usage Limits</h4>
            <p className="mb-2">
              While marketed as "unlimited," the following reasonable limits apply to prevent system abuse:
            </p>
            <p className="mb-2"><strong>Acceptable Use:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600">
              <li><strong>Daily Analyses:</strong> Up to 500 pages per day</li>
              <li><strong>Hourly Rate:</strong> Up to 100 pages per hour</li>
              <li><strong>Per-Minute Rate:</strong> Up to 10 analyses per minute</li>
              <li><strong>Concurrent Requests:</strong> Maximum 3 simultaneous analyses</li>
            </ul>
            
            <p className="mt-3 mb-2"><strong>Typical Use Cases (Well Within Limits):</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600">
              <li>Daily Monitoring: Analyzing 15-50 key pages daily ✓</li>
              <li>Agency Use: Running audits for 5-10 client websites ✓</li>
              <li>Competitive Analysis: Tracking competitors weekly ✓</li>
              <li>Content Team: Optimizing 10-20 new articles daily ✓</li>
            </ul>
            
            <p className="mt-3 text-green-700 font-semibold">
              99% of legitimate users will never hit these limits.
            </p>
          </section>

          {/* Professional Services */}
          <section>
            <h4 className="font-bold text-gray-900 text-base mb-2">Professional Services</h4>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-800">Complete AEO Audit</p>
                <p className="text-gray-600 text-xs">
                  Delivery: 2 weeks from project start • Scope: Up to 15 pages (+$100 per additional page) • 
                  1 round of revisions included • Email support during implementation
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Ongoing Maintenance</p>
                <p className="text-gray-600 text-xs">
                  Monthly audits of all pages • Priority email + Slack access • 
                  Response time within 24 hours (business days) • Up to 15 pages monitored
                </p>
              </div>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h4 className="font-bold text-gray-900 text-base mb-2">Prohibited Activities</h4>
            <p className="mb-2">We reserve the right to temporarily suspend or terminate accounts engaging in:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-red-600">
              <li>Automated Scraping: Using bots to scrape competitor data systematically</li>
              <li>Reselling Access: Sharing accounts or selling analyses to third parties</li>
              <li>System Gaming: Attempting to bypass rate limits or daily caps</li>
              <li>Resource Hogging: Running 1000+ analyses in a short period</li>
              <li>Malicious Use: Analyzing sites you don't own without permission</li>
              <li>Reverse Engineering: Attempting to extract our algorithms</li>
            </ul>
          </section>

          {/* Enforcement */}
          <section>
            <h4 className="font-bold text-gray-900 text-base mb-2">Monitoring & Enforcement</h4>
            <p className="mb-2"><strong>Enforcement Actions:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-gray-600">
              <li>First Violation: Warning email + temporary rate limit reduction</li>
              <li>Second Violation: 24-hour account suspension</li>
              <li>Third Violation: Permanent account termination (no refund)</li>
            </ol>
            <p className="mt-3 text-gray-600">
              <strong>Appeals:</strong> Email support@thatworkx.com with your account email, 
              date/time of issue, and explanation. Response within 48 hours.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h4 className="font-bold text-gray-900 text-base mb-2">Questions?</h4>
            <p className="text-gray-600">
              <strong>General Support:</strong>{' '}
              <a href="mailto:support@thatworkx.com" className="text-blue-600 hover:underline">
                support@thatworkx.com
              </a>
            </p>
            <p className="text-gray-600">
              <strong>Enterprise Sales:</strong>{' '}
              <a href="mailto:enterprise@thatworkx.com" className="text-blue-600 hover:underline">
                enterprise@thatworkx.com
              </a>
            </p>
            <p className="mt-2 text-gray-600">
              <strong>Need higher limits?</strong> Let's talk! We're happy to accommodate 
              legitimate business needs with custom plans.
            </p>
          </section>

          {/* Policy Note */}
          <section className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 italic">
              This policy applies to all users of AEO Audit Suite operated by Thatworkx Solutions. 
              We may update this policy to adjust limits based on system capacity, add new features, 
              respond to abuse patterns, or improve service quality. Major changes will be communicated 
              via email with 30 days notice.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button 
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default FairUsePolicyModal;