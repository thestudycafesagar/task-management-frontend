/**
 * Task Service
 * Handles all task-related API calls
 */
import apiClient from '@/lib/api';

export const taskService = {
  /**
   * Get all tasks with optional filters
   */
  getTasks: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const response = await apiClient.get(`/tasks?${queryParams.toString()}`);
    return response.data.data.tasks;
  },

  /**
   * Get task by ID
   */
  getTaskById: async (taskId) => {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data.data.task;
  },

  /**
   * Create new task
   */
  createTask: async (taskData) => {
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
  },

  /**
   * Update task
   */
  updateTask: async (taskId, updates) => {
    const response = await apiClient.patch(`/tasks/${taskId}`, updates);
    return response.data;
  },

  /**
   * Delete task
   */
  deleteTask: async (taskId) => {
    const response = await apiClient.delete(`/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Update task status (employee)
   */
  updateTaskStatus: async (taskId, status) => {
    const response = await apiClient.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  /**
   * Update attachment status
   */
  updateAttachmentStatus: async (taskId, attachmentId, status) => {
    const response = await apiClient.patch(
      `/tasks/${taskId}/attachments/${attachmentId}/status`,
      { status }
    );
    return response.data;
  },

  /**
   * Upload task attachment
   */
  uploadAttachment: async (taskId, file) => {
    const formData = new FormData();
    formData.append('attachment', file);
    
    const response = await apiClient.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Delete task attachment
   */
  deleteAttachment: async (taskId, attachmentId) => {
    const response = await apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return response.data;
  },

  /**
   * Get task statistics
   */
  getTaskStats: async () => {
    const response = await apiClient.get('/tasks/stats');
    return response.data.data.stats;
  },

  /**
   * Get task analytics
   */
  getTaskAnalytics: async () => {
    const response = await apiClient.get('/tasks/analytics');
    return response.data.data.analytics;
  },

  /**
   * Export tasks to calendar
   */
  exportToCalendar: async () => {
    const response = await apiClient.get('/tasks/export/calendar', {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Bulk assign tasks
   */
  bulkAssignTasks: async (taskIds, employeeIds) => {
    const response = await apiClient.post('/tasks/bulk-assign', {
      taskIds,
      employeeIds
    });
    return response.data;
  },

  /**
   * Bulk update task status
   */
  bulkUpdateStatus: async (taskIds, status) => {
    const response = await apiClient.patch('/tasks/bulk-status', {
      taskIds,
      status
    });
    return response.data;
  },
};
