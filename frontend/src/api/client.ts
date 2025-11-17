import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Rate limit tracking
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

let currentRateLimit: RateLimitInfo = {
  limit: 1000,
  remaining: 1000,
  reset: Date.now() + 3600000,
};

export const getRateLimitInfo = (): RateLimitInfo => currentRateLimit;

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and track rate limits
apiClient.interceptors.response.use(
  (response) => {
    // Extract rate limit headers if present
    const headers = response.headers;
    if (headers['x-ratelimit-limit']) {
      currentRateLimit = {
        limit: parseInt(headers['x-ratelimit-limit'], 10),
        remaining: parseInt(headers['x-ratelimit-remaining'], 10),
        reset: parseInt(headers['x-ratelimit-reset'], 10) * 1000, // Convert to milliseconds
      };

      // Emit event for RateLimitIndicator to update
      window.dispatchEvent(new CustomEvent('ratelimit-update', { detail: currentRateLimit }));
    }

    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      toast.error(
        `Rate limit exceeded. Please try again ${retryAfter ? `in ${retryAfter} seconds` : 'later'}.`,
        { duration: 5000 }
      );
      return Promise.reject(error);
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }

    // Handle validation errors
    if (error.response?.status === 400) {
      const message = error.response.data?.error?.message || 'Invalid request';
      toast.error(message);
      return Promise.reject(error);
    }

    // Handle forbidden errors
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
      return Promise.reject(error);
    }

    // Handle not found errors
    if (error.response?.status === 404) {
      toast.error('Resource not found.');
      return Promise.reject(error);
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
      return Promise.reject(error);
    }

    // Generic error handler
    toast.error('An unexpected error occurred.');
    return Promise.reject(error);
  }
);

export default apiClient;
