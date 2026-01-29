/**
 * User/Employee Service
 * Handles all user/employee-related API calls
 */
import apiClient from '@/lib/api';

export const userService = {
  /**
   * Get all employees in organization
   */
  getEmployees: async () => {
    const response = await apiClient.get('/users');
    return response.data.data.employees;
  },

  /**
   * Get employees by organization slug
   */
  getEmployeesByOrg: async (slug) => {
    const response = await apiClient.get(`/users/organization/${slug}`);
    return response.data;
  },

  /**
   * Get employee by ID
   */
  getEmployeeById: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data.data.user;
  },

  /**
   * Create new employee
   */
  createEmployee: async (employeeData) => {
    const response = await apiClient.post('/users', employeeData);
    return response.data;
  },

  /**
   * Update employee
   */
  updateEmployee: async (userId, updates) => {
    const response = await apiClient.patch(`/users/${userId}`, updates);
    return response.data;
  },

  /**
   * Delete employee
   */
  deleteEmployee: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  /**
   * Toggle employee active status
   */
  toggleEmployeeStatus: async (userId) => {
    const response = await apiClient.patch(`/users/${userId}/toggle-status`);
    return response.data;
  },

  /**
   * Force change employee password (admin only)
   */
  forceChangePassword: async (userId, newPassword) => {
    const response = await apiClient.post(`/users/${userId}/force-change-password`, {
      newPassword
    });
    return response.data;
  },

  /**
   * Update employee profile picture
   */
  updateProfilePicture: async (userId, file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await apiClient.patch(`/users/${userId}/profile-picture`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Get employee performance stats
   */
  getEmployeeStats: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/stats`);
    return response.data.data.stats;
  },

  /**
   * Bulk create employees
   */
  bulkCreateEmployees: async (employeesData) => {
    const response = await apiClient.post('/users/bulk-create', {
      employees: employeesData
    });
    return response.data;
  },

  /**
   * Export employees to CSV
   */
  exportEmployees: async () => {
    const response = await apiClient.get('/users/export/csv', {
      responseType: 'blob'
    });
    return response.data;
  },
};
