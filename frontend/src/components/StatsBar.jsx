import React, { useState, useEffect } from 'react';
import { TrendingUp, Users } from 'lucide-react';

const StatsBar = () => {
  const [stats, setStats] = useState({
    totalAnalyses: 1025,
    totalUsers: 78
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/stats`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Keep using default/cached values on error
    } finally {
      setIsLoading(false);
    }
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num.toLocaleString('en-US');
  };

  return (
    <div className="bg-primary-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-center gap-8 text-sm font-medium">
          {/* AEO Reports Generated */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>
              {formatNumber(stats.totalAnalyses)} AEO Reports Generated
            </span>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-white/30" />

          {/* Registered Users */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>
              {formatNumber(stats.totalUsers)} Registered Users
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;