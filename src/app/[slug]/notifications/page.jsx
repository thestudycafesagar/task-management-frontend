'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import useNotificationStore from '@/store/notificationStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  FiBell, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiInfo, 
  FiClock,
  FiCheck,
  FiTrash2,
  FiFilter,
  FiCheckSquare
} from 'react-icons/fi';
import { formatDateTime } from '@/lib/utils';

export default function NotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notifications, setNotifications, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();
  
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, TASK_ASSIGNED, TASK_UPDATED, etc.

  // Fetch notifications - Real-time updates via Socket.IO
  const { isLoading, refetch } = useQuery({
    queryKey: ['notifications', params.slug],
    queryFn: async () => {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data.data.notifications, response.data.data.unreadCount);
      return response.data.data;
    },
    staleTime: 60000, // Data stays fresh for 60 seconds
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: (_, notificationId) => {
      markAsRead(notificationId);
      refetch();
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      markAllAsRead();
      toast.success('All notifications marked as read');
      refetch();
    },
    onError: () => {
      toast.error('Failed to mark all as read');
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      await apiClient.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      toast.success('Notification deleted');
      refetch();
    },
    onError: () => {
      toast.error('Failed to delete notification');
    },
  });

  // Clear all notifications
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      // Delete all notifications via API
      await apiClient.delete('/notifications');
    },
    onSuccess: () => {
      clearNotifications();
      toast.success('All notifications cleared');
      refetch();
    },
    onError: () => {
      toast.error('Failed to clear notifications');
    },
  });

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Filter by read/unread status
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'read' && !notification.isRead) return false;

    // Filter by type
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;

    return true;
  });

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }

    // Navigate to task if taskId exists
    if (notification.taskId) {
      router.push(`/${params.slug}/tasks`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <FiCheckSquare className="w-5 h-5 text-blue-600" />;
      case 'TASK_UPDATED':
        return <FiAlertCircle className="w-5 h-5 text-amber-600" />;
      case 'TASK_COMPLETED':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case 'TASK_OVERDUE':
        return <FiClock className="w-5 h-5 text-red-600" />;
      default:
        return <FiInfo className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type, isRead) => {
    if (isRead) return 'bg-gray-50';
    
    switch (type) {
      case 'TASK_ASSIGNED':
        return 'bg-blue-50 border-blue-200';
      case 'TASK_UPDATED':
        return 'bg-amber-50 border-amber-200';
      case 'TASK_COMPLETED':
        return 'bg-green-50 border-green-200';
      case 'TASK_OVERDUE':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader title="Notifications" description="Stay updated with your tasks" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        description={`${notifications.length} total notifications`}
        action={
          notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FiCheck className="w-4 h-4" />
                Mark All Read
              </button>
              <button
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <FiTrash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          )
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FiFilter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'unread'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({notifications.filter(n => !n.isRead).length})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'read'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Read ({notifications.filter(n => n.isRead).length})
            </button>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          >
            <option value="all">All Types</option>
            <option value="TASK_ASSIGNED">Task Assigned</option>
            <option value="TASK_UPDATED">Task Updated</option>
            <option value="TASK_COMPLETED">Task Completed</option>
            <option value="TASK_OVERDUE">Task Overdue</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiBell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : filter === 'read'
                ? 'No read notifications yet.'
                : 'You have no notifications at this time.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`
                relative bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md group
                ${getNotificationBgColor(notification.type, notification.isRead)}
                ${!notification.isRead ? 'border-l-4' : 'border-gray-200'}
              `}
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    {!notification.isRead && (
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {formatDateTime(notification.createdAt)}
                    </div>
                    <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium border border-gray-200">
                      {notification.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsReadMutation.mutate(notification._id);
                      }}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <FiCheck className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotificationMutation.mutate(notification._id);
                    }}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
