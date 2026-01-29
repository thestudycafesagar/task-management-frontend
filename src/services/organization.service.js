/**
 * Organization Service
 * Handles all organization-related API calls
 */
import apiClient from '@/lib/api';

export const organizationService = {
  /**
   * Get organization by slug
   */
  getOrganization: async (slug) => {
    const response = await apiClient.get(`/organizations/${slug}`);
    return response.data.data.organization;
  },

  /**
   * Update organization
   */
  updateOrganization: async (organizationId, updates) => {
    const response = await apiClient.patch(`/organizations/${organizationId}`, updates);
    return response.data;
  },

  /**
   * Upload organization logo
   */
  uploadLogo: async (organizationId, file) => {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await apiClient.patch(`/organizations/${organizationId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Get organization settings
   */
  getSettings: async (organizationId) => {
    const response = await apiClient.get(`/organizations/${organizationId}/settings`);
    return response.data.data.settings;
  },

  /**
   * Update organization settings
   */
  updateSettings: async (organizationId, settings) => {
    const response = await apiClient.patch(`/organizations/${organizationId}/settings`, settings);
    return response.data;
  },
};
