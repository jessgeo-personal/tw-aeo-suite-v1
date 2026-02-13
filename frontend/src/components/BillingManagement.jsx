import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import apiService from '../services/api';

const BillingManagement = ({ currentUser, onRefresh }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessing, setAccessing] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await apiService.subscription.getStatus();
      if (response.success) {
        setSubscription(response.subscription);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setAccessing(true);
    try {
      const response = await apiService.subscription.createPortal();
      if (response.success && response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      alert(error.message || 'Failed to access billing portal');
      setAccessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const hasPro = subscription?.hasActiveSubscription;
  const willCancel = subscription?.cancelAtPeriodEnd;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription & Billing
        </h2>
        <p className="text-gray-600">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Current Plan */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Current Plan
          </h3>
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {subscription?.type === 'pro' ? 'Pro' : 'Free'}
                  </span>
                  {hasPro ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {subscription?.dailyLimit} analyses per day
                </p>
              </div>
              
              {hasPro && (
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  willCancel 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {willCancel ? 'Canceling' : 'Active'}
                </div>
              )}
            </div>

            {hasPro && subscription.endDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {willCancel ? 'Access until' : 'Renews on'}{' '}
                  {new Date(subscription.endDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}

            {willCancel && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Your subscription will not renew. You'll keep Pro access until the end date.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {hasPro ? (
          <button
            onClick={handleManageBilling}
            disabled={accessing}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {accessing ? (
              <span>Loading...</span>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Manage Billing & Payment
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Upgrade to Pro for unlimited access to all features
            </p>
            <button
              onClick={onRefresh}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              View Pro Plans
            </button>
          </div>
        )}

        {/* Features Comparison */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Plan Features
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Free</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 5 analyses per day</li>
                <li>• Basic analyzer access</li>
                <li>• Summary reports</li>
              </ul>
            </div>
            <div className="border-2 border-cyan-500 rounded-lg p-4 bg-cyan-50">
              <h4 className="font-semibold text-cyan-900 mb-2">Pro</h4>
              <ul className="text-sm text-cyan-900 space-y-1">
                <li>• 50 analyses per day</li>
                <li>• All 5 analyzers</li>
                <li>• Detailed PDF reports</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingManagement;
