import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Crown, ChevronDown, CreditCard, Sparkles } from 'lucide-react';

const UserMenu = ({ user, onLogout, onManageSubscription, onUpgrade }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const subscriptionType = user.subscription?.type || 'free';
  const hasPro = subscriptionType === 'pro' || subscriptionType === 'enterprise';
  
  const subscriptionBadge = {
    free: { text: 'Free', color: 'bg-dark-600 text-dark-300' },
    pro: { text: 'Pro', color: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white' },
    enterprise: { text: 'Enterprise', color: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' }
  };

  const badge = subscriptionBadge[subscriptionType];

  const handleManageClick = () => {
    setIsOpen(false);
    if (onManageSubscription) {
      onManageSubscription();
    }
  };

  const handleUpgradeClick = () => {
    setIsOpen(false);
    if (onUpgrade) {
      onUpgrade();
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-lg transition-colors"
      >
        <User size={16} className="text-dark-300" />
        <span className="text-sm text-dark-100 hidden sm:inline max-w-[150px] truncate">
          {user.email}
        </span>
        <ChevronDown size={14} className={`text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-dark-800 border border-dark-600 rounded-lg shadow-xl overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-dark-700">
            <p className="text-sm text-dark-100 font-medium truncate">{user.email}</p>
            {user.firstName && (
              <p className="text-xs text-dark-400 mt-1">
                {user.firstName} {user.lastName}
              </p>
            )}
          </div>

          {/* Subscription Status */}
          <div className="px-4 py-3 border-b border-dark-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-dark-400">Subscription</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${badge.color} flex items-center gap-1`}>
                {subscriptionType !== 'free' && <Crown size={12} />}
                {badge.text}
              </span>
            </div>
            {user.subscription?.endDate && (
              <p className="text-xs text-dark-500 mt-1">
                Renews: {new Date(user.subscription.endDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Subscription Actions */}
          {hasPro ? (
            // Pro/Enterprise users - Show "Manage Subscription"
            <button
              onClick={handleManageClick}
              className="w-full px-4 py-3 text-left text-sm text-dark-100 hover:bg-dark-700 transition-colors flex items-center gap-2 border-b border-dark-700"
            >
              <CreditCard size={16} className="text-primary-500" />
              Manage Subscription
            </button>
          ) : (
            // Free users - Show "Upgrade to Pro"
            <button
              onClick={handleUpgradeClick}
              className="w-full px-4 py-3 text-left text-sm hover:bg-dark-700 transition-colors flex items-center gap-2 border-b border-dark-700"
            >
              <Sparkles size={16} className="text-yellow-500" />
              <span className="bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent font-semibold">
                Upgrade to Pro
              </span>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-dark-700 transition-colors flex items-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;