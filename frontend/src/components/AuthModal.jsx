import React, { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import apiService from '../services/api';

const AuthModal = ({ isOpen, onClose, onSuccess, prefilledEmail = '' }) => {
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [formData, setFormData] = useState({
    email: prefilledEmail,
    firstName: '',
    lastName: '',
    country: 'United Arab Emirates',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.auth.requestOTP(formData);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.auth.verifyOTP(formData.email, otp);
      onSuccess(response.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/10 rounded-full mb-4">
              {step === 'email' ? (
                <Mail className="w-8 h-8 text-primary-500" />
              ) : (
                <Lock className="w-8 h-8 text-primary-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {step === 'email' ? 'Get Started' : 'Verify Your Email'}
            </h2>
            <p className="text-dark-400">
              {step === 'email'
                ? 'Enter your details to receive a verification code'
                : `We sent a 6-digit code to ${formData.email}`}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Email form */}
          {step === 'email' && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          )}

          {/* OTP verification form */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg text-white text-center text-2xl font-mono tracking-widest placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="000000"
                  autoFocus
                />
                <p className="mt-2 text-xs text-dark-500">
                  Code expires in 10 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                }}
                className="w-full py-2 text-dark-400 hover:text-white text-sm transition-colors"
              >
                Didn't receive code? Request new one
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
