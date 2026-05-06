import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Rocket, Mail, Loader2, CreditCard } from 'lucide-react';
import LeadFormModal from './LeadFormModal';
import apiService from '../services/api';

const PricingModal = ({ isOpen, onClose, initialTab = 'subscription', user = null }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const [leadFormConfig, setLeadFormConfig] = useState({
    isOpen: false,
    serviceName: '',
    leadInterest: '',
    isComingSoon: false
  });

  // Get user's subscription status
  const userSubscriptionType = user?.subscription?.type || 'free';
  const isProOrHigher = userSubscriptionType === 'pro' || userSubscriptionType === 'enterprise';

  // Update active tab when modal opens with different initialTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Load plans from Stripe when subscription tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'subscription' && plans.length === 0) {
      loadPlans();
    }
  }, [isOpen, activeTab, plans.length]);

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await apiService.subscription.getPlans();
      if (response.success) {
        setPlans(response.plans);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSubscribe = async (priceId) => {
    if (!user) {
      alert('Please sign in to subscribe');
      return;
    }

    setCheckingOut(true);
    setCheckoutError('');
    
    try {
      const response = await apiService.subscription.createCheckout(priceId);
      if (response.success && response.url) {
        window.location.assign(response.url);
      } else {
        setCheckoutError('Failed to start checkout. Please try again.');
        setCheckingOut(false);
      }
    } catch (error) {
      setCheckoutError(error.message || 'Failed to start checkout');
      setCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  // Function to open lead form
  const openLeadForm = (serviceName, leadInterest, isComingSoon = false) => {
    setLeadFormConfig({
      isOpen: true,
      serviceName,
      leadInterest,
      isComingSoon
    });
  };

  // Function to close lead form
  const closeLeadForm = () => {
    setLeadFormConfig({
      isOpen: false,
      serviceName: '',
      leadInterest: '',
      isComingSoon: false
    });
  };

  const professionalServices = [
    {
      name: 'Technical AEO Audit',
      price: '$2,000',
      duration: '2-3 weeks',
      description: 'Comprehensive technical optimization for AI search visibility',
      features: [
        'Full schema markup implementation',
        'Technical SEO audit specific to AI crawlers',
        'HTML structure optimization',
        'Crawlability enhancement',
        'Custom schema recommendations',
        'Detailed implementation guide',
        'Post-implementation testing',
      ],
      cta: 'Request Quote',
      leadInterest: 'AEO Technical Audit'
    },
    {
      name: 'Content Optimization',
      price: '$1,500',
      duration: '2-3 weeks',
      description: 'Content structure and quality optimization for AI citations',
      features: [
        'Content readability analysis',
        'Q&A pattern optimization',
        'Citation-friendly formatting',
        'Fact density improvements',
        'Content hierarchy recommendations',
        'Expert guidance on revisions',
      ],
      cta: 'Request Quote',
      leadInterest: 'AEO Content Optimization',
      popular: true
    },
    {
      name: 'Full AEO Implementation',
      price: '$5,000',
      duration: '4-6 weeks',
      description: 'Complete AEO transformation from analysis to implementation',
      features: [
        'Everything from Technical + Content',
        'Site-wide E-E-A-T enhancement',
        'Authority building strategy',
        'Competitive analysis',
        'Query research & optimization',
        'Implementation management',
        '3 months post-launch support',
      ],
      cta: 'Request Quote',
      leadInterest: 'AEO Full Implementation'
    },
    {
      name: 'Monthly Retainer',
      price: '$150',
      duration: '/month',
      description: 'Ongoing AEO maintenance and optimization',
      features: [
        '2 analyses per month',
        'Monthly optimization recommendations',
        'Performance monitoring',
        'Priority email support',
        'Quarterly strategy calls',
      ],
      cta: 'Subscribe',
      leadInterest: 'AEO Monthly Retainer'
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        {/* Scrollable container */}
        <div className="relative w-full max-w-6xl max-h-[90vh] bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Fixed header with close button */}
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-dark-700 bg-dark-800">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white">
                Choose Your Plan
              </h2>
              <p className="text-dark-400 mt-1">
                Unlock unlimited analyses or get expert AEO implementation
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-4 text-dark-400 hover:text-white transition-colors hover:bg-dark-700 rounded-lg p-2"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>

          {/* Current Subscription Status Banner */}
          {user && (
            <div className={`flex-shrink-0 px-6 py-3 border-b border-dark-700 ${
              userSubscriptionType === 'free' 
                ? 'bg-dark-750' 
                : userSubscriptionType === 'pro'
                ? 'bg-gradient-to-r from-yellow-500/10 to-amber-600/10'
                : 'bg-gradient-to-r from-purple-600/10 to-indigo-600/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-dark-300">Current Plan:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    userSubscriptionType === 'free'
                      ? 'bg-dark-600 text-dark-200'
                      : userSubscriptionType === 'pro'
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  }`}>
                    {userSubscriptionType === 'free' ? 'Free' : userSubscriptionType === 'pro' ? 'Pro' : 'Enterprise'}
                  </span>
                  {user.subscription?.endDate && (
                    <span className="text-xs text-dark-400">
                      • Renews {new Date(user.subscription.endDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {isProOrHigher && (
                  <span className="text-xs text-primary-400 font-medium">✓ You have full access</span>
                )}
              </div>
            </div>
          )}

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              {/* Tabs */}
              <div className="flex gap-4 mb-8 border-b border-dark-700">
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`px-6 py-3 font-semibold transition-colors relative ${
                    activeTab === 'subscription'
                      ? 'text-primary-500'
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  Subscription Plans
                  {activeTab === 'subscription' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`px-6 py-3 font-semibold transition-colors relative ${
                    activeTab === 'services'
                      ? 'text-primary-500'
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  Professional Services
                  {activeTab === 'services' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                  )}
                </button>
              </div>

              {/* Subscription Plans */}
              {activeTab === 'subscription' && (
                <>
                  {loadingPlans ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                      <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                      <p className="text-dark-400">Loading subscription plans...</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      {/* Free Plan - Still Static as it is not a Stripe plan */}
                      <div className="relative bg-dark-900 border border-dark-700 rounded-xl p-6 transition-all">
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500/10 rounded-full mb-4">
                            <Sparkles className="w-6 h-6 text-primary-500" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-white">$0</span>
                            <span className="text-dark-400">/month</span>
                          </div>
                        </div>
                        <ul className="space-y-3 mb-6">
                          <li className="flex items-start gap-2 text-sm">
                            <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-dark-300">10 analyses per day</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm">
                            <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-dark-300">All 5 analyzers</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm">
                            <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-dark-300">Basic recommendations</span>
                          </li>
                        </ul>
                        <button
                          disabled
                          className="w-full py-3 font-semibold rounded-lg bg-dark-800 text-dark-500 cursor-not-allowed"
                        >
                          Current Plan
                        </button>
                      </div>

                      {/* Dynamic Stripe Plans */}
                      {plans.map((plan) => {
                        const isAnnual = plan.interval === 'year';
                        return (
                          <div
                            key={plan.id}
                            className={`relative bg-dark-900 border rounded-xl p-6 transition-all ${
                              isAnnual
                                ? 'border-primary-500 shadow-lg shadow-primary-500/20'
                                : 'border-dark-700 hover:border-dark-600'
                            }`}
                          >
                            {isAnnual && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 rounded-full text-xs font-bold text-white">
                                Best Value
                              </div>
                            )}

                            <div className="text-center mb-6">
                              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500/10 rounded-full mb-4">
                                <Rocket className="w-6 h-6 text-primary-500" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">
                                {plan.name}
                              </h3>
                              <div className="flex items-baseline justify-center gap-1">
                                <span className="text-4xl font-bold text-white">
                                  ${plan.price}
                                </span>
                                <span className="text-dark-400">/{plan.interval}</span>
                              </div>
                            </div>

                            <ul className="space-y-3 mb-6">
                              {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-dark-300">{feature}</span>
                                </li>
                              ))}
                            </ul>

                            <button
                              disabled={checkingOut || isProOrHigher}
                              onClick={() => handleSubscribe(plan.priceId)}
                              className={`w-full py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                isAnnual
                                  ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg'
                                  : 'bg-dark-800 hover:bg-dark-700 text-white border border-dark-700'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {checkingOut ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Processing...
                                </>
                              ) : isProOrHigher ? (
                                'Already Subscribed'
                              ) : (
                                <>
                                  <CreditCard className="w-4 h-4" />
                                  Upgrade to Pro
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Checkout Error Message */}
                  {checkoutError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-center">
                      <p className="text-red-400 text-sm">{checkoutError}</p>
                    </div>
                  )}

                  {/* Enterprise Plan Link */}
                  <div className="text-center py-4 border-t border-dark-700">
                    <p className="text-dark-300">
                      For increased access to the Audit tool, opt for our{' '}
                      <button
                        onClick={() => openLeadForm('Enterprise Plan', 'AEO Enterprise Plan', true)}
                        className="text-primary-500 hover:text-primary-400 underline font-semibold transition-colors"
                      >
                        Enterprise Plan
                      </button>
                    </p>
                  </div>
                </>
              )}

              {/* Professional Services */}
              {activeTab === 'services' && (
                <div className="space-y-4">
                  {professionalServices.map((service, idx) => (
                    <div
                      key={idx}
                      className={`bg-dark-900 border rounded-xl p-6 transition-all ${
                        service.popular
                          ? 'border-primary-500 shadow-lg shadow-primary-500/20'
                          : 'border-dark-700 hover:border-dark-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                        <div className="flex-1 min-w-[250px]">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-xl font-bold text-white">
                              {service.name}
                            </h3>
                            {service.popular && (
                              <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs font-bold text-primary-500">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-dark-400 mb-2">{service.description}</p>
                          <div className="text-sm text-dark-500">
                            Duration: {service.duration}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white mb-2">
                            {service.price}
                          </div>
                          <button 
                            onClick={() => openLeadForm(service.name, service.leadInterest)}
                            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                          >
                            {service.cta}
                          </button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        {service.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-dark-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Custom Solutions */}
                  <div className="mt-8 p-6 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                    <div className="flex items-start gap-4">
                      <Mail className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">
                          Custom Solutions Available
                        </h4>
                        <p className="text-dark-300 mb-4">
                          Need something specific? We offer customized AEO solutions tailored to your unique requirements.
                        </p>
                        <button
                          onClick={() => openLeadForm('Custom Solutions', 'AEO Professional Services')}
                          className="inline-block px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
                        >
                          Contact Us
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom close button for convenience */}
              <div className="mt-8 pt-6 border-t border-dark-700 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <X size={20} />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={leadFormConfig.isOpen}
        onClose={closeLeadForm}
        serviceName={leadFormConfig.serviceName}
        leadInterest={leadFormConfig.leadInterest}
        isComingSoon={leadFormConfig.isComingSoon}
      />
    </>
  );
};

export default PricingModal;
