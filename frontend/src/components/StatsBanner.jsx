import React, { useState, useEffect } from 'react';
import { TrendingUp, Users } from 'lucide-react';
import { API_URL } from '../config/api';

/**
 * Stats Banner - Shows live analysis and user count
 * Visible to all users as social proof
 * Positioned above header
 */
//const StatsBanner = ({ isUpgraded = false }) => {
const StatsBanner = () => {
  const [stats, setStats] = useState({ totalAnalyses: 950, totalUsers: 43 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load
    fetchStats();

    // Update every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setIsLoading(false);
    }
  };

  // Don't render if upgraded
  //if (isUpgraded) return null;

  return (
    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>
                <span className="font-bold">{stats.totalAnalyses.toLocaleString()}</span>
                <span className="opacity-90 ml-1">AEO Reports Generated</span>
              </>
            )}
          </span>
        </div>
        <div className="hidden sm:block w-px h-4 bg-white/30" />
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="font-medium">
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>
                <span className="font-bold">{stats.totalUsers.toLocaleString()}</span>
                <span className="opacity-90 ml-1">Registered Users</span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsBanner;