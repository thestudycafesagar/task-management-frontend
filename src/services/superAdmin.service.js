/**
 * Super Admin Service
 * Handles all super admin-related API calls
 */
import apiClient from '@/lib/api';

export const superAdminService = {
  /**
   * Get all organizations
   */
  getOrganizations: async () => {
    const response = await apiClient.get('/super-admin/organizations');
    return response.data.data.organizations;
  },

  /**
   * Create organization
   */
  createOrganization: async (organizationData) => {
    const response = await apiClient.post('/super-admin/organizations', organizationData);
    return response.data;
  },

  /**
   * Update organization
   */
  updateOrganization: async (organizationId, updates) => {
    const response = await apiClient.patch(`/super-admin/organizations/${organizationId}`, updates);
    return response.data;
  },

  /**
   * Delete organization
   */
  deleteOrganization: async (organizationId) => {
    const response = await apiClient.delete(`/super-admin/organizations/${organizationId}`);
    return response.data;
  },

  /**
   * Toggle organization status
   */
  toggleOrganizationStatus: async (organizationId) => {
    const response = await apiClient.patch(`/super-admin/organizations/${organizationId}/toggle-status`);
    return response.data;
  },

  /**
   * Get system stats
   */
  getSystemStats: async () => {
    const response = await apiClient.get('/super-admin/stats');
    return response.data.data.stats;
  },

  /**
   * Get audit logs
   */
  getAuditLogs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.action) queryParams.append('action', params.action);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.organizationId) queryParams.append('organizationId', params.organizationId);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const response = await apiClient.get(`/super-admin/audit-logs?${queryParams.toString()}`);
    return response.data.data.logs;
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
