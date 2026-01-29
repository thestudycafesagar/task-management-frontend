/**
 * Bucket Service
 * Handles all bucket-related API calls
 */
import apiClient from '@/lib/api';

export const bucketService = {
  /**
   * Get all buckets
   */
  getBuckets: async () => {
    const response = await apiClient.get('/buckets');
    return response.data.data.buckets;
  },

  /**
   * Get bucket by ID
   */
  getBucketById: async (bucketId) => {
    const response = await apiClient.get(`/buckets/${bucketId}`);
    return response.data.data.bucket;
  },

  /**
   * Create new bucket
   */
  createBucket: async (bucketData) => {
    const response = await apiClient.post('/buckets', bucketData);
    return response.data;
  },

  /**
   * Update bucket
   */
  updateBucket: async (bucketId, updates) => {
    const response = await apiClient.patch(`/buckets/${bucketId}`, updates);
    return response.data;
  },

  /**
   * Delete bucket
   */
  deleteBucket: async (bucketId) => {
    const response = await apiClient.delete(`/buckets/${bucketId}`);
    return response.data;
  },

  /**
   * Get tasks in bucket
   */
  getBucketTasks: async (bucketId) => {
    const response = await apiClient.get(`/buckets/${bucketId}/tasks`);
    return response.data.data.tasks;
  },

  /**
   * Move task to bucket
   */
  moveTaskToBucket: async (taskId, bucketId) => {
    const response = await apiClient.patch(`/tasks/${taskId}`, { bucketId });
    return response.data;
  },

  /**
   * Get bucket statistics
   */
  getBucketStats: async (bucketId) => {
    const response = await apiClient.get(`/buckets/${bucketId}/stats`);
    return response.data.data.stats;
  },

  /**
   * Reorder buckets
   */
  reorderBuckets: async (bucketIds) => {
    const response = await apiClient.post('/buckets/reorder', { bucketIds });
    return response.data;
  },
};
