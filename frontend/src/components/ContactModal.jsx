import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Contact Modal with HubSpot Embedded Form
 * Uses HubSpot's form embed script to load the contact form
 */
const ContactModal = ({ isOpen, onClose }) => {
  const formContainerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load HubSpot script if not already loaded
    const loadHubSpotScript = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="hsforms.net"]');
      if (existingScript) {
        scriptLoadedRef.current = true;
        initializeForm();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js-eu1.hsforms.net/forms/embed/146079438.js';
      script.defer = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        initializeForm();
      };
      document.head.appendChild(script);
    };

    const initializeForm = () => {
      // Small delay to ensure HubSpot script is fully initialized
      setTimeout(() => {
        if (formContainerRef.current && window.hbspt) {
          // Clear any existing form
          formContainerRef.current.innerHTML = '';
          
          // Create the form
          window.hbspt.forms.create({
            region: 'eu1',
            portalId: '146079438',
            formId: '5e6580cb-217c-4799-b700-fcf754b9e1c6',
            target: '#hubspot-contact-form',
            onFormSubmitted: () => {
              // Optional: Close modal after successful submission
              setTimeout(() => {
                onClose();
              }, 2000);
            }
          });
        }
      }, 100);
    };

    loadHubSpotScript();

    // Cleanup function
    return () => {
      if (formContainerRef.current) {
        formContainerRef.current.innerHTML = '';
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Contact Us</h3>
            <p className="text-sm text-gray-600">Get in touch with our AEO experts</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Container */}
        <div className="px-6 py-6 overflow-y-auto max-h-[70vh]">
          <div 
            id="hubspot-contact-form" 
            ref={formContainerRef}
            className="hubspot-form-container"
          >
            {/* Loading state */}
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading form...</span>
            </div>
          </div>
        </div>
      </div>

      {/* HubSpot form styling overrides */}
      <style>{`
        .hubspot-form-container .hs-form {
          font-family: inherit;
        }
        .hubspot-form-container .hs-form-field {
          margin-bottom: 1rem;
        }
        .hubspot-form-container .hs-form-field label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .hubspot-form-container .hs-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .hubspot-form-container .hs-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .hubspot-form-container .hs-button {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .hubspot-form-container .hs-button:hover {
          background-color: #1d4ed8;
        }
        .hubspot-form-container .hs-error-msgs {
          color: #dc2626;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        .hubspot-form-container .submitted-message {
          text-align: center;
          padding: 2rem;
          color: #059669;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ContactModal;