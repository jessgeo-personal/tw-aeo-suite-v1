import React, { useState } from 'react';
import { 
  CreditCard, Check, X, Zap, Users, BarChart, 
  Clock, TrendingUp, Shield, AlertCircle, ChevronRight 
} from 'lucide-react';

// ============================================
// PRICING & UPGRADE MODAL
// ============================================

const PricingModal = ({ isOpen, onClose, currentPlan = 'free' }) => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly, semi-annual, annual
  const [showProServices, setShowProServices] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = (plan, cycle) => {
    // TODO: Will integrate with Stripe when activated
    alert(`Stripe integration coming soon!\n\nSelected: ${plan} (${cycle})`);
  };

  const handleContactProServices = (service) => {
    // TODO: Create contact form submission
    alert(`Professional Services - ${service}\n\nContact form coming soon!`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose the plan that fits your AEO optimization needs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toggle: Subscriptions vs Professional Services */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex gap-2 max-w-md mx-auto">
            <button
              onClick={() => setShowProServices(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                !showProServices
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Self-Service Plans
            </button>
            <button
              onClick={() => setShowProServices(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                showProServices
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Professional Services
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showProServices ? (
            <SubscriptionPlans 
              billingCycle={billingCycle}
              setBillingCycle={setBillingCycle}
              currentPlan={currentPlan}
              onUpgrade={handleUpgrade}
            />
          ) : (
            <ProfessionalServices onContact={handleContactProServices} />
          )}
        </div>

        {/* Fair Usage Notice */}
        <div className="px-6 py-4 bg-blue-50 border-t">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">Fair Usage Policy</p>
              <p className="text-blue-700 mt-1">
                All plans include reasonable usage limits to ensure service quality for everyone. 
                <a href="#fair-usage" className="underline ml-1">View policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUBSCRIPTION PLANS
// ============================================

const SubscriptionPlans = ({ billingCycle, setBillingCycle, currentPlan, onUpgrade }) => {
  const plans = {
    monthly: {
      price: 20,
      period: 'month',
      total: 20,
      savings: null
    },
    'semi-annual': {
      price: 17,
      period: 'month',
      total: 102,
      savings: '15% off',
      popular: true
    },
    annual: {
      price: 15,
      period: 'month',
      total: 180,
      savings: '25% off'
    }
  };

  const features = {
    free: [
      { text: '3 analyses per tool per day', included: true },
      { text: '4 specialized AEO tools', included: true },
      { text: 'Basic recommendations', included: true },
      { text: 'Export reports', included: false },
      { text: 'Priority support', included: false },
      { text: 'API access', included: false }
    ],
    unlimited: [
      { text: 'Unlimited daily analyses', included: true },
      { text: '4 specialized AEO tools', included: true },
      { text: 'Enhanced recommendations with examples', included: true },
      { text: 'Export reports (PDF/CSV)', included: true },
      { text: 'Priority email support', included: true },
      { text: 'API access (coming soon)', included: true }
    ]
  };

  return (
    <div>
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('semi-annual')}
            className={`px-6 py-2 rounded-md font-medium transition-colors relative ${
              billingCycle === 'semi-annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            6 Months
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              15% off
            </span>
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md font-medium transition-colors relative ${
              billingCycle === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              25% off
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-600">/forever</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Perfect for trying out AEO optimization
            </p>
          </div>

          <ul className="space-y-3 mb-6">
            {features.free.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                {feature.included ? (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                )}
                <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          <button
            disabled={currentPlan === 'free'}
            className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
          </button>
        </div>

        {/* Unlimited Plan */}
        <div className="border-2 border-blue-500 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white relative">
          {plans[billingCycle].popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                Most Popular
              </span>
            </div>
          )}

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unlimited</h3>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-bold text-blue-600">
                ${plans[billingCycle].price}
              </span>
              <span className="text-gray-600">/{plans[billingCycle].period}</span>
            </div>
            {plans[billingCycle].savings && (
              <div className="mt-2">
                <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                  {plans[billingCycle].savings}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-600 mt-2">
              Billed ${plans[billingCycle].total} {billingCycle === 'monthly' ? 'monthly' : 'upfront'}
            </p>
          </div>

          <ul className="space-y-3 mb-6">
            {features.unlimited.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                {feature.included ? (
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-gray-700 font-medium">
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onUpgrade('unlimited', billingCycle)}
            disabled={currentPlan !== 'free'}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {currentPlan === 'free' ? (
              <>
                <Zap className="w-5 h-5" />
                Upgrade Now
              </>
            ) : (
              'Current Plan'
            )}
          </button>
        </div>
      </div>

      {/* Use Cases */}
      <div className="mt-12 max-w-4xl mx-auto">
        <h3 className="text-lg font-bold text-center text-gray-900 mb-6">
          Perfect for these use cases:
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <BarChart className="w-8 h-8 text-blue-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Daily Monitoring</h4>
            <p className="text-sm text-gray-600">
              Track your website's AEO score changes as you implement optimizations
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <Users className="w-8 h-8 text-blue-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Agency Use</h4>
            <p className="text-sm text-gray-600">
              Analyze multiple client websites without daily limits
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <TrendingUp className="w-8 h-8 text-blue-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Competitive Analysis</h4>
            <p className="text-sm text-gray-600">
              Compare your pages against competitors frequently
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PROFESSIONAL SERVICES
// ============================================

const ProfessionalServices = ({ onContact }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Let Us Handle It For You
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Our team of AEO experts will optimize your website and maintain it for peak AI visibility
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* One-Time Audit & Implementation */}
        <div className="border-2 border-gray-200 rounded-xl p-6 bg-white hover:border-blue-300 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-1">
                Complete AEO Audit
              </h4>
              <p className="text-sm text-gray-600">
                One-time optimization service
              </p>
            </div>
            <div className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
              Popular
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-gray-900">$2,000</span>
              <span className="text-gray-600">for 15 pages</span>
            </div>
            <p className="text-sm text-gray-600">
              + $100 per additional page
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>Complete AEO audit</strong> of all pages
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>Schema markup implementation</strong> (FAQ, Article, Organization)
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>Content restructuring</strong> for AI visibility
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>Technical optimization</strong> (H1, canonical, meta)
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>Before/after reports</strong> with score improvements
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>2 weeks delivery</strong> with implementation guide
              </span>
            </div>
          </div>

          <button
            onClick={() => onContact('audit')}
            className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            Get Started
            <ChevronRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Perfect for: New websites, major redesigns, one-time optimization
          </p>
        </div>

        {/* Ongoing Maintenance */}
        <div className="border-2 border-purple-200 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-1">
                Ongoing Maintenance
              </h4>
              <p className="text-sm text-gray-600">
                Monthly monitoring & optimization
              </p>
            </div>
            <div className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">
              Best Value
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-purple-600">$150</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="text-sm text-gray-600">
              for 15 page website
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>Monthly audits</strong> of all pages
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>Continuous optimization</strong> as AI algorithms evolve
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>New content review</strong> & optimization
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>Competitor tracking</strong> & benchmarking
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>Monthly reports</strong> with insights & recommendations
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <strong>Priority support</strong> via email & Slack
              </span>
            </div>
          </div>

          <button
            onClick={() => onContact('maintenance')}
            className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            Get Started
            <ChevronRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Perfect for: Established sites, blogs, e-commerce, competitive industries
          </p>
        </div>
      </div>

      {/* Why Choose Professional Services */}
      <div className="mt-12 bg-gray-50 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 text-center mb-6">
          Why Choose Professional Services?
        </h4>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">Expert Team</h5>
            <p className="text-gray-600">
              Our AEO specialists have optimized 100+ websites for AI visibility
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">Save Time</h5>
            <p className="text-gray-600">
              Focus on your business while we handle the technical optimization
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">Proven Results</h5>
            <p className="text-gray-600">
              Average 40% increase in AI citations within 60 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// UPGRADE BUTTON/LINK COMPONENT
// ============================================

export const UpgradeButton = ({ onClick, variant = 'primary', className = '' }) => {
  if (variant === 'link') {
    return (
      <button
        onClick={onClick}
        className={`text-blue-600 hover:text-blue-800 underline text-sm font-medium ${className}`}
      >
        Upgrade for unlimited
      </button>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between rounded-lg">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5" />
          <div>
            <p className="font-semibold">Upgrade to Unlimited</p>
            <p className="text-sm text-blue-100">Analyze unlimited pages daily</p>
          </div>
        </div>
        <button
          onClick={onClick}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          View Plans
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors ${className}`}
    >
      <Zap className="w-4 h-4" />
      Upgrade
    </button>
  );
};

export default PricingModal;
