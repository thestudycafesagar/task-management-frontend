import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 30000, // 30 second timeout for slow Render startups
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

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
      console.error('❌ Request timeout - Server may be starting up');
      
      // Retry logic for timeouts (Render spin-up)
      if (!originalRequest._retry && originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount = originalRequest._retryCount || 0;
        originalRequest._retryCount++;
        
        console.log(`⏳ Retrying request (${originalRequest._retryCount}/${MAX_RETRIES})...`);
        await sleep(RETRY_DELAY);
        
        return apiClient(originalRequest);
      }
      
      return Promise.reject(new Error('Server is taking too long to respond. Please try again.'));
    }

    // Handle network errors with retry
    if (error.message === 'Network Error' && !originalRequest._retry) {
      console.error('❌ Network error - Server may be starting');
      
      if (originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount = originalRequest._retryCount || 0;
        originalRequest._retryCount++;
        
        console.log(`⏳ Retrying request (${originalRequest._retryCount}/${MAX_RETRIES})...`);
        await sleep(RETRY_DELAY);
        
        return apiClient(originalRequest);
      }
      
      return Promise.reject(new Error('Cannot connect to server. Please check your connection.'));
    }

    if (error.response?.status === 401) {
      // Clear any invalid cookies and redirect to login
      if (typeof window !== 'undefined') {
        // Clear the auth cookie
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Clear auth store if available
        try {
          const { default: useAuthStore } = await import('@/store/authStore');
          const store = useAuthStore.getState();
          store.setUser(null);
          store.setOrganization(null);
        } catch (e) {
          // Store might not be available, continue anyway
        }
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
