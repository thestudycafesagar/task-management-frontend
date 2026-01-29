/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
import apiClient from '@/lib/api';

export const authService = {
  /**
   * Company signup
   */
  companySignup: async (data) => {
    const response = await apiClient.post('/auth/company-signup', data);
    return response.data;
  },

  /**
   * User login
   */
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * User logout
   */
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data) => {
    const response = await apiClient.patch('/auth/me', data);
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data) => {
    const response = await apiClient.patch('/auth/change-password', data);
    return response.data;
  },

  /**
   * Super admin login
   */
  superAdminLogin: async (credentials) => {
    const response = await apiClient.post('/auth/super-admin/login', credentials);
    return response.data;
  },

  /**
   * Impersonate organization
   */
  impersonate: async (organizationId) => {
    const response = await apiClient.post(`/super-admin/organizations/${organizationId}/impersonate`);
    return response.data;
  },

  /**
   * Stop impersonation
   */
  stopImpersonation: async () => {
    const response = await apiClient.post('/super-admin/stop-impersonation');
    return response.data;
  },
};
