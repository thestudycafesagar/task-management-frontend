import { create } from 'zustand';
import apiClient from '@/lib/api';

/**
 * Auth store for managing authentication state
 */
const useAuthStore = create((set, get) => ({
  user: null,
  organization: null,
  isImpersonating: false,
  hasAdminPrivileges: false,
  isLoading: false,
  isAuthenticated: false,
  hasInitialized: false,
  token: null, // Store token for Socket.IO

  /**
   * Set user data
   */
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  /**
   * Set token
   */
  setToken: (token) => set({ token }),

  /**
   * Set organization data
   */
  setOrganization: (organization) => set({ organization }),

  /**
   * Set impersonation status
   */
  setImpersonating: (isImpersonating) => set({ isImpersonating }),

  /**
   * Fetch current user
   */
  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get('/auth/me');
      set({
        user: response.data.data.user,
        organization: response.data.data.organization,
        token: response.data.data.token, // Store token for Socket.IO
        isImpersonating: response.data.data.isImpersonating || false,
        hasAdminPrivileges: response.data.data.hasAdminPrivileges || false,
        isAuthenticated: true,
        isLoading: false,
        hasInitialized: true,
      });
      return response.data.data;
    } catch (error) {
      set({
        user: null,
        organization: null,
        token: null, // Clear token
        isImpersonating: false,
        hasAdminPrivileges: false,
        isAuthenticated: false,
        isLoading: false,
        hasInitialized: true,
      });
      throw error;
    }
  },

  /**
   * Login
   */
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const userData = response.data.data;
    const isAdminOrSuperAdmin = userData.user.role === 'ADMIN' || userData.user.role === 'SUPER_ADMIN';
    set({
      user: userData.user,
      organization: userData.organization,
      token: userData.token, // Store token for Socket.IO
      isAuthenticated: true,
      hasAdminPrivileges: isAdminOrSuperAdmin,
      isLoading: false,
      hasInitialized: true,
    });
    return userData;
  },

  /**
   * Logout
   */
  logout: async () => {
    await apiClient.post('/auth/logout');
    set({
      user: null,
      organization: null,
      token: null, // Clear token
      isImpersonating: false,
      hasAdminPrivileges: false,
      isAuthenticated: false,
      hasInitialized: true, // Keep initialized to prevent re-fetch
    });
  },

  /**
   * Company signup
   */
  signup: async (companyName, adminName, adminEmail, password) => {
    const response = await apiClient.post('/auth/signup', {
      companyName,
      adminName,
      adminEmail,
      password,
    });
    const userData = response.data.data;
    const isAdminOrSuperAdmin = userData.user.role === 'ADMIN' || userData.user.role === 'SUPER_ADMIN';
    set({
      user: userData.user,
      organization: userData.organization,
      token: userData.token, // Store token for Socket.IO
      isAuthenticated: true,
      hasAdminPrivileges: isAdminOrSuperAdmin,
      hasInitialized: true,
    });
    return userData;
  },

  /**
   * Impersonate organization (Super Admin only)
   */
  impersonate: async (organizationId) => {
    const response = await apiClient.post('/auth/impersonate', { organizationId });
    // Immediately fetch user data to update isImpersonating flag
    await get().fetchUser();
    return response.data.data;
  },

  /**
   * Exit impersonation
   */
  exitImpersonation: async () => {
    const response = await apiClient.post('/auth/exit-impersonation');
    await get().fetchUser();
    return response.data.data;
  },

  /**
   * Update FCM token
   */
  updateFCMToken: async (fcmToken) => {
    await apiClient.post('/auth/fcm-token', { fcmToken });
  },
}));

export default useAuthStore;
