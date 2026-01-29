/**
 * useNotifications Hook
 * Handles notification-related business logic and state management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services';
import toast from 'react-hot-toast';

export const useNotifications = (filters = {}) => {
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationService.getNotifications(filters),
    staleTime: 10000,
    refetchInterval: 30000,
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: notificationService.getUnreadCount,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error) => {
      toast.error('Failed to mark notification as read');
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      toast.success('✅ All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error) => {
      toast.error('Failed to mark all as read');
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error) => {
      toast.error('Failed to delete notification');
    },
  });

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: notificationService.clearAll,
    onSuccess: () => {
      toast.success('✅ All notifications cleared');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error) => {
      toast.error('Failed to clear notifications');
    },
  });

  return {
    // Data
    notifications,
    unreadCount,
    
    // Loading states
    isLoading,
    
    // Actions
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    clearAll: clearAllMutation.mutate,
    refetch,
  };
};
