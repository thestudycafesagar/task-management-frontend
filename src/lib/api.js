import axios from 'axios';

const isDev = typeof window !== 'undefined' && process.env.NODE_ENV !== 'production';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 30000, // 30 second timeout for slow startups
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

// Track if we're already handling a 401 to prevent loops
let isHandling401 = false;

/**
 * Sleep helper for retries
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add Authorization header with token from localStorage/authStore if available
    if (typeof window !== 'undefined') {
      try {
        // Try to get token from auth store
        const authStoreData = localStorage.getItem('auth-storage');
        if (authStoreData) {
          const { state } = JSON.parse(authStoreData);
          if (state?.token) {
            config.headers.Authorization = `Bearer ${state.token}`;
          }
        }
      } catch (e) {
        // Ignore errors, will fall back to cookie auth
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle timeout errors with retry
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      if (isDev) console.error('Request timeout - Server may be starting up');
      
      // Retry logic for timeouts
      if (!originalRequest._retry && (originalRequest._retryCount || 0) < MAX_RETRIES) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        
        if (isDev) console.log(`Retrying request (${originalRequest._retryCount}/${MAX_RETRIES})...`);
        await sleep(RETRY_DELAY);
        
        return apiClient(originalRequest);
      }
      
      return Promise.reject(new Error('Server is taking too long to respond. Please try again.'));
    }

    // Handle network errors with retry
    if (error.message === 'Network Error' && !originalRequest._retry) {
      if (isDev) console.error('Network error - Server may be starting');
      
      if ((originalRequest._retryCount || 0) < MAX_RETRIES) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        
        if (isDev) console.log(`Retrying request (${originalRequest._retryCount}/${MAX_RETRIES})...`);
        await sleep(RETRY_DELAY);
        
        return apiClient(originalRequest);
      }
      
      return Promise.reject(new Error('Cannot connect to server. Please check your connection.'));
    }

    // Handle 401 errors - but don't immediately logout
    // Only logout on 401 from /auth/me endpoint (session validation)
    if (error.response?.status === 401 && !isHandling401) {
      const isAuthMeRequest = originalRequest.url?.includes('/auth/me');
      const isLoginRequest = originalRequest.url?.includes('/auth/login');
      
      // Don't handle 401 for login requests (wrong password)
      if (isLoginRequest) {
        return Promise.reject(error);
      }
      
      // Only force logout if the /auth/me endpoint returns 401
      // This means the session is truly invalid
      if (isAuthMeRequest) {
        isHandling401 = true;
        
        if (typeof window !== 'undefined') {
          // Clear the auth cookie
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          // Clear auth store
          try {
            localStorage.removeItem('auth-storage');
          } catch (e) {
            // Ignore
          }
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        
        // Reset flag after a delay
        setTimeout(() => {
          isHandling401 = false;
        }, 2000);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
