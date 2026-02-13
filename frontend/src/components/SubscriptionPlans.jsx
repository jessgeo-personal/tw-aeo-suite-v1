import React, { useState, useEffect } from 'react';
import { Check, Sparkles, CreditCard, CheckCircle } from 'lucide-react';
import apiService from '../services/api';

const SubscriptionPlans = ({ currentUser, onClose }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Check if user has active subscription
  const userSubscriptionType = currentUser?.subscription?.type || 'free';
  const isProOrHigher = userSubscriptionType === 'pro' || userSubscriptionType === 'enterprise';
  const hasActiveSubscription = currentUser?.subscription?.status === 'active';

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await apiService.subscription.getPlans();
      if (response.success) {
        setPlans(response.plans);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId) => {
    if (!currentUser) {
      alert('Please sign in to subscribe');
      return;
    }

    if (isProOrHigher && hasActiveSubscription) {
      alert('You already have an active Pro subscription');
      return;
    }

    setCheckingOut(true);
    try {
      const response = await apiService.subscription.createCheckout(
        priceId,
        couponCode || null
      );

      if (response.success && response.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      }
    } catch (error) {
      alert(error.message || 'Failed to start checkout');
      setCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await apiService.subscription.createPortal();
      if (response.success && response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      alert('Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-dark-800 rounded-lg p-8 border border-dark-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-dark-900 to-dark-800 p-8 border-b border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {isProOrHigher ? 'Your Pro Subscription' : 'Upgrade to Pro'}
              </h2>
              <p className="text-dark-400">
                {isProOrHigher 
                  ? 'Manage your subscription and billing details'
                  : 'Get unlimited access to all AEO analysis features'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-dark-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Current Plan Status (if Pro user) */}
        {isProOrHigher && (
          <div className="p-6 border-b border-dark-700 bg-gradient-to-r from-primary-500/10 to-primary-600/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-primary-500" />
                <div>
                  <p className="text-white font-semibold">Active Pro Subscription</p>
                  <p className="text-dark-400 text-sm">
                    {currentUser?.subscription?.endDate && 
                      `Renews on ${new Date(currentUser.subscription.endDate).toLocaleDateString()}`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleManageSubscription}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="p-8">
          {!isProOrHigher ? (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {plans.map((plan) => {
                  const isAnnual = plan.interval === 'year';
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative border-2 rounded-xl p-6 bg-dark-900 ${
                        isAnnual
                          ? 'border-primary-500 shadow-lg shadow-primary-500/20'
                          : 'border-dark-700'
                      }`}
                    >
                      {isAnnual && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            Best Value
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {plan.name}
                        </h3>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-4xl font-bold text-white">
                            ${plan.price}
                          </span>
                          <span className="text-dark-400">
                            /{plan.interval}
                          </span>
                        </div>
                        {plan.savings && (
                          <p className="text-green-500 font-semibold mt-2">
                            {plan.savings}
                          </p>
                        )}
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                            <span className="text-dark-300">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handleSubscribe(plan.priceId)}
                        disabled={checkingOut}
                        className={`w-full py-3 rounded-lg font-semibold transition-all ${
                          isAnnual
                            ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg'
                            : 'bg-dark-700 text-white hover:bg-dark-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {checkingOut ? (
                          <span>Processing...</span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Subscribe Now
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code */}
              <div className="border-t border-dark-700 pt-6">
                {!showCouponInput ? (
                  <button
                    onClick={() => setShowCouponInput(true)}
                    className="text-primary-500 hover:text-primary-400 text-sm font-semibold"
                  >
                    Have a coupon code?
                  </button>
                ) : (
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => {
                        setShowCouponInput(false);
                        setCouponCode('');
                      }}
                      className="px-4 py-2 text-dark-400 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-dark-900 border border-dark-700 rounded-lg">
                <ul className="text-sm text-dark-400 space-y-2">
                  <li>✓ Secure payment via Stripe</li>
                  <li>✓ Cancel anytime - keep access until period ends</li>
                  <li>✓ No refunds for partial months/years</li>
                  <li>✓ Auto-renews unless canceled</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                You're all set!
              </h3>
              <p className="text-dark-400 mb-6">
                You have unlimited access to all Pro features
              </p>
              <button
                onClick={handleManageSubscription}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
              >
                Manage Billing & Subscription
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;