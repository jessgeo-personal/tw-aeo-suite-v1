// API Configuration
// - Local development: Empty string (proxy in package.json handles routing to backend)
// - Production: Full URL from environment variable

export const API_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.REACT_APP_API_URL || '') 
  : '';

// Helper to build API endpoints
export const apiEndpoint = (path) => `${API_URL}${path}`;
