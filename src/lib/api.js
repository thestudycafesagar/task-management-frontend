import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 15000, // 15 second timeout to prevent hanging
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('❌ Request timeout - Server may be down');
      if (typeof window !== 'undefined') {
        // Don't redirect on timeout, just let the error propagate
        return Promise.reject(new Error('Request timeout - Please check if server is running'));
      }
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('❌ Network error - Server may not be running');
      return Promise.reject(new Error('Cannot connect to server - Please ensure backend is running'));
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
