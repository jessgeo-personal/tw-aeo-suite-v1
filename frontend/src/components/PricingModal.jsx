import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Rocket, Mail } from 'lucide-react';
import LeadFormModal from './LeadFormModal';

const PricingModal = ({ isOpen, onClose, initialTab = 'subscription' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [leadFormConfig, setLeadFormConfig] = useState({
    isOpen: false,
    serviceName: '',
    leadInterest: '',
    isComingSoon: false
  });

  // Update active tab when modal opens with different initialTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

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

  const subscriptionPlans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      features: [
        '10 analyses per day',
        'All 5 analyzers',
        'Basic recommendations',
        'Email support',
      ],
      limitations: [
        'No PDF exports',
        'No priority support',
        'No advanced insights',
      ],
      cta: 'Current Plan',
      disabled: true,
      icon: Sparkles,
    },
    {
      name: 'Pro',
      price: '$20',
      period: '/month',
      popular: true,
      features: [
        'Unlimited analyses',
        'All 5 analyzers',
        'Advanced recommendations',
        'PDF report exports',
        'Priority email support',
        'Analysis history',
        'Trend tracking',
      ],
      cta: 'Upgrade to Pro',
      icon: Rocket,
      leadInterest: 'AEO Pro Plan'
    },
    {
      name: 'Pro Annual',
      price: '$180',
      period: '/year',
      badge: 'Save $60',
      features: [
        'Everything in Pro',
        '2 months free',
        'Quarterly consultation calls',
        'Custom recommendations',
      ],
      cta: 'Get Annual Plan',
      icon: Rocket,
      leadInterest: 'AEO Pro Plan'
    },
  ];

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
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    {subscriptionPlans.map((plan, idx) => {
                      const Icon = plan.icon;
                      return (
                        <div
                          key={idx}
                          className={`relative bg-dark-900 border rounded-xl p-6 transition-all ${
                            plan.popular
                              ? 'border-primary-500 shadow-lg shadow-primary-500/20'
                              : 'border-dark-700 hover:border-dark-600'
                          }`}
                        >
                          {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 rounded-full text-xs font-bold text-white">
                              Most Popular
                            </div>
                          )}
                          {plan.badge && (
                            <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500 rounded-full text-xs font-bold text-white">
                              {plan.badge}
                            </div>
                          )}

                          <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500/10 rounded-full mb-4">
                              <Icon className="w-6 h-6 text-primary-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                              {plan.name}
                            </h3>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-4xl font-bold text-white">
                                {plan.price}
                              </span>
                              <span className="text-dark-400">{plan.period}</span>
                            </div>
                          </div>

                          <ul className="space-y-3 mb-6">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-dark-300">{feature}</span>
                              </li>
                            ))}
                            {plan.limitations && plan.limitations.map((limitation, i) => (
                              <li key={`limit-${i}`} className="flex items-start gap-2 text-sm">
                                <X size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                <span className="text-dark-500 line-through">{limitation}</span>
                              </li>
                            ))}
                          </ul>

                          <button
                            disabled={plan.disabled}
                            onClick={() => !plan.disabled && openLeadForm(plan.name, plan.leadInterest, true)}
                            className={`w-full py-3 font-semibold rounded-lg transition-colors ${
                              plan.popular
                                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                                : plan.disabled
                                ? 'bg-dark-800 text-dark-500 cursor-not-allowed'
                                : 'bg-dark-800 hover:bg-dark-700 text-white border border-dark-700'
                            }`}
                          >
                            {plan.cta}
                          </button>
                        </div>
                      );
                    })}
                  </div>

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