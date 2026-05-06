import React from 'react';
import { APP_VERSION } from '../config/version';

const VersionFooter = ({ showFairUseModal, setShowFairUseModal }) => {
  return (
    <footer className="bg-dark-900 border-t border-dark-800 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Company */}
          <div className="col-span-2">
            <h3 className="text-white font-bold mb-4">Thatworkx Solutions</h3>
            <p className="text-dark-400 text-sm max-w-xs">
              Building Content Optimization tools for the next generation of AI-powered search.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-bold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-dark-400">
              <li>
                <a 
                  href="https://www.linkedin.com/company/thatworkx-solutions" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a 
                  href="https://thatworkx.com/privacy-policy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-dark-400">
              <li>
                <a href="mailto:support@thatworkx.com" className="hover:text-white transition-colors">
                  support@thatworkx.com
                </a>
              </li>
              <li>
                <a 
                  href="https://thatworkx.com/contact" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors"
                >
                  Contact Form
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-800 pt-8 text-center text-sm text-dark-500">
          <div className="flex items-center justify-center gap-4 mb-2">
            <button
              onClick={() => setShowFairUseModal && setShowFairUseModal(true)}
              className="hover:text-white transition-colors"
            >
              Fair Use Policy
            </button>
            <span>•</span>
            <a 
              href="https://thatworkx.com/contact" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
          <p>© 2026 Thatworkx Solutions. All rights reserved. <span className="ml-2 text-dark-600 font-mono text-xs">v{APP_VERSION}</span></p>
        </div>
      </div>
    </footer>
  );
};

export default VersionFooter;
