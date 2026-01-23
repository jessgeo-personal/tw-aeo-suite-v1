import React from 'react';
import { TrendingUp, Zap } from 'lucide-react';

const UsageBadge = ({ current, limit, className = '' }) => {
  const percentage = (current / limit) * 100;
  const remaining = limit - current;

  const getColor = () => {
    if (percentage >= 100) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (percentage >= 80) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (percentage >= 60) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-green-500 bg-green-500/10 border-green-500/30';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getColor()} ${className}`}>
      <Zap size={16} className="flex-shrink-0" />
      <div className="text-sm font-medium">
        <span className="font-bold">{remaining}</span>
        <span className="opacity-75"> / {limit} analyses left today</span>
      </div>
    </div>
  );
};

export default UsageBadge;
