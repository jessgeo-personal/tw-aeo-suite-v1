import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
});

// API Service
const apiService = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/api/health');
    return response.data;
  },

  // Auth endpoints
  auth: {
    requestOTP: async (userData) => {
      const response = await api.post('/api/auth/request-otp', userData);
      return response.data;
    },

    verifyOTP: async (email, otp) => {
      const response = await api.post('/api/auth/verify-otp', { email, otp });
      return response.data;
    },

    getSession: async () => {
      const response = await api.get('/api/auth/session');
      return response.data;
    },

    logout: async () => {
      const response = await api.post('/api/auth/logout');
      return response.data;
    },
  },

  // Analysis endpoints
  analysis: {
    runAnalysis: async (url, targetKeywords = [], email) => {
      const response = await api.post('/api/analyze', {
        url,
        targetKeywords,
        email,
      });
      return response.data;
    },

    getHistory: async () => {
      const response = await api.get('/api/analyses');
      return response.data;
    },
  },
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const errorData = error.response.data || {};
      const errorMessage = errorData.message || 'An error occurred';
      
      // Handle specific error cases
      if (error.response.status === 401) {
        // Unauthorized - session expired
        console.error('Session expired. Please login again.');
      } else if (error.response.status === 429) {
        // Rate limit exceeded
        console.error('Rate limit exceeded. Please try again later.');
      }
      
      // Preserve all error data from server response
      const customError = new Error(errorMessage);
      customError.blockDetection = errorData.blockDetection;
      customError.aeoImpact = errorData.aeoImpact;
      customError.recommendation = errorData.recommendation;
      
      throw customError;
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Request failed');
    }
  }
);

export default apiService;