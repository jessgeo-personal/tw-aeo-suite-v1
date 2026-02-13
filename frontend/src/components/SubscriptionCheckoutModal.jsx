import React, { useState } from 'react';
import { X, Building2, Loader2 } from 'lucide-react';
import apiService from '../services/api';

/**
 * SubscriptionCheckoutModal
 * Collects company name before redirecting to Stripe checkout
 * Required for Pro subscriptions
 */
const SubscriptionCheckoutModal = ({ 
  isOpen, 
  onClose, 
  priceId, 
  planName,
  user 
}) => {
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!company.trim()) {
      setError('Company name is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Update user with company name first
      await apiService.user.updateProfile({ company: company.trim() });

      // Create checkout session
      const response = await apiService.subscription.createCheckout(priceId);
      
      if (response.url) {
        // Redirect to Stripe checkout
        window.location.href = response.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      setError(err.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/10 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Subscribe to {planName}
            </h2>
            <p className="text-dark-400">
              Please provide your company details to continue
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubscribe} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg text-dark-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="Your Company Ltd."
                disabled={loading}
              />
              <p className="mt-1 text-xs text-dark-500">
                Required for billing and invoicing purposes
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !company.trim()}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirecting to Checkout...
                </>
              ) : (
                'Continue to Payment'
              )}
            </button>

            <p className="text-center text-xs text-dark-500">
              You'll be redirected to Stripe's secure checkout
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckoutModal;
