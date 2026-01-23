// Get color class based on score
export const getScoreColor = (score) => {
  if (score >= 90) return 'text-green-500';
  if (score >= 80) return 'text-blue-500';
  if (score >= 70) return 'text-yellow-500';
  if (score >= 60) return 'text-orange-500';
  return 'text-red-500';
};

// Get background color class based on score
export const getScoreBgColor = (score) => {
  if (score >= 90) return 'bg-green-500/10 border-green-500/30';
  if (score >= 80) return 'bg-blue-500/10 border-blue-500/30';
  if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/30';
  if (score >= 60) return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-red-500/10 border-red-500/30';
};

// Get grade badge color
export const getGradeColor = (grade) => {
  const colors = {
    'A': 'bg-green-500 text-white',
    'B': 'bg-blue-500 text-white',
    'C': 'bg-yellow-500 text-white',
    'D': 'bg-orange-500 text-white',
    'F': 'bg-red-500 text-white',
  };
  return colors[grade] || 'bg-gray-500 text-white';
};

// Format processing time
export const formatProcessingTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Validate URL
export const isValidUrl = (url) => {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

// Format URL for display
export const formatUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch {
    return url;
  }
};

// Get analyzer icon name
export const getAnalyzerIcon = (analyzerName) => {
  const icons = {
    technicalFoundation: 'Code2',
    contentStructure: 'FileText',
    pageLevelEEAT: 'Award',
    queryMatch: 'Search',
    aiVisibility: 'Eye',
  };
  return icons[analyzerName] || 'FileText';
};

// Get analyzer display name
export const getAnalyzerDisplayName = (analyzerName) => {
  const names = {
    technicalFoundation: 'Technical Foundation',
    contentStructure: 'Content Structure',
    pageLevelEEAT: 'Page-Level E-E-A-T',
    queryMatch: 'Query Match',
    aiVisibility: 'AI Visibility',
  };
  return names[analyzerName] || analyzerName;
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get recommendation priority icon
export const getRecommendationPriorityIcon = (text) => {
  if (text.toUpperCase().includes('CRITICAL')) return 'AlertTriangle';
  if (text.toUpperCase().includes('HIGH PRIORITY')) return 'AlertCircle';
  return 'Info';
};

// Get recommendation priority color
export const getRecommendationPriorityColor = (text) => {
  if (text.toUpperCase().includes('CRITICAL')) return 'text-red-500';
  if (text.toUpperCase().includes('HIGH PRIORITY')) return 'text-orange-500';
  return 'text-blue-500';
};
