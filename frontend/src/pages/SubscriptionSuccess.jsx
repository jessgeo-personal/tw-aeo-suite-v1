import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Sparkles } from 'lucide-react';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-900 rounded-2xl border border-dark-700 p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-xl opacity-50"></div>
            <CheckCircle className="relative w-20 h-20 text-green-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          Welcome to Pro!
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </h1>

        {/* Message */}
        <p className="text-dark-300 mb-6">
          Your subscription is now active. You have full access to all Pro features.
        </p>

        {/* Features */}
        <div className="bg-dark-800 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-dark-400 mb-3">You now have access to:</p>
          <ul className="space-y-2 text-sm text-dark-200">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              50 analyses per day
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              All 5 analyzers
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Detailed PDF reports
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Priority support
            </li>
          </ul>
        </div>

        {/* Countdown */}
        <p className="text-dark-500 text-sm mb-4">
          Redirecting to home in {countdown} seconds...
        </p>

        {/* Action */}
        <button
          onClick={() => navigate('/', { replace: true })}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          Start Using Pro Features
        </button>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;