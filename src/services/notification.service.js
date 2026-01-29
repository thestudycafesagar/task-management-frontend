/**
 * Notification Service
 * Handles all notification-related API calls
 */
import apiClient from '@/lib/api';

export const notificationService = {
  /**
   * Get all notifications
   */
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.read !== undefined) queryParams.append('read', params.read);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const response = await apiClient.get(`/notifications?${queryParams.toString()}`);
    return response.data.data.notifications;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Get unread count
   */
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.data.count;
  },

  /**
   * Clear all notifications
   */
  clearAll: async () => {
    const response = await apiClient.delete('/notifications/clear-all');
    return response.data;
  },
};
