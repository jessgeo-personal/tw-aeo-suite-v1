import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HistoryPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlParam = queryParams.get('url');
  
  const [url, setUrl] = useState(urlParam || '');
  const [days, setDays] = useState(30);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
      if (urlParam) {
        fetchHistory();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlParam]);
  
  const fetchHistory = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/analyses/history?url=${encodeURIComponent(url)}&days=${days}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      setHistory(data);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const exportCSV = () => {
    const exportUrl = `${process.env.REACT_APP_API_URL}/api/analyses/history/export?url=${encodeURIComponent(url)}&days=${days}`;
    window.open(exportUrl, '_blank');
  };
  
  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Analysis History</h1>
        
        {/* Search Bar */}
        <div className="bg-dark-900 rounded-lg p-6 mb-8">
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to view history"
              className="flex-1 min-w-[300px] px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
            />
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
            >
              {loading ? 'Loading...' : 'View History'}
            </button>
          </div>
          {error && (
            <p className="text-red-400 mt-4 text-sm">{error}</p>
          )}
        </div>
        
        {/* History Results */}
        {history && (
          <>
            {/* Timeline Chart */}
            <div className="bg-dark-900 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Score Timeline</h2>
                <button
                  onClick={exportCSV}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
              
              {/* Simple ASCII Chart */}
              <div className="relative h-64 bg-dark-800 rounded-lg p-4">
                {history.trendHistory.length > 0 ? (
                  <div className="h-full flex items-end justify-between gap-1">
                    {history.trendHistory.map((point, index) => {
                      const height = (point.score / 100) * 100; // Percentage
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-sky-500 rounded-t transition-all hover:bg-sky-400"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                            title={`${point.score} on ${new Date(point.date).toLocaleDateString()}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No data available for timeline
                  </div>
                )}
              </div>
            </div>
            
            {/* History Table */}
            <div className="bg-dark-900 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-dark-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Overall</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Technical</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Content</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">E-E-A-T</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Query</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">AI Vis.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {history.analyses.map((analysis) => (
                    <tr key={analysis.id} className="hover:bg-dark-800 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {new Date(analysis.date).toLocaleDateString()} <br />
                        <span className="text-xs text-gray-500">
                          {new Date(analysis.date).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-white">{analysis.overallScore}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-300">{analysis.scores.technical}</td>
                      <td className="px-6 py-4 text-center text-gray-300">{analysis.scores.content}</td>
                      <td className="px-6 py-4 text-center text-gray-300">{analysis.scores.eeat}</td>
                      <td className="px-6 py-4 text-center text-gray-300">{analysis.scores.queryMatch}</td>
                      <td className="px-6 py-4 text-center text-gray-300">{analysis.scores.aiVisibility}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {history.analyses.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  No analysis history found for this URL in the selected time period.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;