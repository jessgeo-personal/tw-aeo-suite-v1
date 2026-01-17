import React, { useState, useEffect } from 'react';
import { X, Mail, Globe, User, Phone, AlertTriangle, Loader2, ExternalLink, Lock, Clock, CheckCircle2 } from 'lucide-react';

/**
 * Countries list for dropdown
 */
const countries = [
  'United Arab Emirates', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'India', 'Singapore', 'Germany', 'France', 'Saudi Arabia', 'Qatar', 'Kuwait',
  'Bahrain', 'Oman', 'Egypt', 'Jordan', 'Lebanon', 'Pakistan', 'Bangladesh',
  'Philippines', 'Indonesia', 'Malaysia', 'Thailand', 'China', 'Japan', 'South Korea',
  'Brazil', 'Mexico', 'South Africa', 'Nigeria', 'Netherlands', 'Belgium', 'Switzerland',
  'Italy', 'Spain', 'Portugal', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland',
  'Poland', 'Austria', 'New Zealand', 'Russia', 'Turkey', 'Israel', 'Vietnam'
].sort();

/**
 * Lead Capture Modal
 * Email and Country are required (shown first)
 * First Name, Last Name, Phone are optional
 */
export const LeadCaptureModal = ({ onSubmit, onClose, loading, error, url,minimal = true }) => {
  const [formData, setFormData] = useState({
    email: '',
    country: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    
    // Validate required fields
    if (!formData.email) {
      setValidationError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    if (!formData.country) {
      setValidationError('Country is required');
      return;
    }
    
    onSubmit(formData);
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setValidationError('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Get Your Free AEO Audit</h2>
              {url && (
                <p className="text-sm text-gray-600 mt-1 truncate max-w-[280px]">
                  Analyzing: <span className="text-blue-600">{url}</span>
                </p>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Required Fields First */}
          <div className="space-y-4">
            {/* Email - Required */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Mail className="w-4 h-4" />
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Country - Required */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Globe className="w-4 h-4" />
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.country}
                onChange={(e) => updateField('country', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
                disabled={loading}
              >
                <option value="">Select your country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Fields - Collapsible section heading */}
          {!minimal && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-3">Optional information</p>
            
            {/* Name Row */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <User className="w-4 h-4" />
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <User className="w-4 h-4" />
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={formData.phoneNumber}
                  onChange={(e) => updateField('phoneNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {(validationError || error) && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{validationError || error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Start Free Audit
                <ExternalLink className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500">
            We'll send you a one-time code to verify your email
          </p>
        </form>
      </div>
    </div>
  );
};

/**
 * OTP Verification Modal
 */
export const OTPModal = ({ email, onVerify, onResend, onBack, loading, error }) => {
  const [otp, setOTP] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setTimer(60);
    await onResend();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onBack}>
      <div 
        className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Verify Your Email</h2>
              <p className="text-sm text-gray-600 mt-1">Code sent to {email}</p>
            </div>
            <button 
              onClick={onBack} 
              className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from your email
            </p>
          </div>

          <div className="mb-4">
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOTP(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Verify Code
              </>
            )}
          </button>

          <div className="text-center mt-4">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-sm font-medium text-blue-600 hover:underline"
                disabled={loading}
              >
                Resend Code
              </button>
            ) : (
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Resend code in {timer}s
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadCaptureModal;