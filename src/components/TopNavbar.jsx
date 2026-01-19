'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AiTwotoneNotification } from "react-icons/ai";
import { FiBell, FiLogOut, FiAlertCircle, FiSettings, FiClock, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';
import UserAvatar from './UserAvatar';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

/**
 * Top navigation bar component
 */
export default function TopNavbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, organization, isImpersonating, logout, exitImpersonation, hasAdminPrivileges } = useAuthStore();
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Fetch notifications from API - Real-time updates via Socket.IO
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications');
      console.log('📩 Fetched notifications:', response.data.data);
      return response.data.data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!user, // Only fetch if user is logged in
  });

  // Update store when notifications data changes
  useEffect(() => {
    if (notificationsData) {
      console.log('✅ Setting notifications in store:', notificationsData.notifications.length, 'unread:', notificationsData.unreadCount);
      setNotifications(notificationsData.notifications, notificationsData.unreadCount);
    }
  }, [notificationsData, setNotifications]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: (_, notificationId) => {
      markAsRead(notificationId);
      queryClient.refetchQueries({ queryKey: ['notifications'], type: 'active' });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      markAllAsRead();
      queryClient.refetchQueries({ queryKey: ['notifications'], type: 'active' });
      toast.success('All notifications marked as read');
    },
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_UPDATED':
        return { icon: AiTwotoneNotification, color: 'bg-blue-100 text-blue-600' };
      case 'TASK_COMMENT':
        return { icon: FiMessageSquare, color: 'bg-purple-100 text-purple-600' };
      case 'TASK_COMPLETED':
      case 'TASK_ACCEPTED':
        return { icon: FiCheckCircle, color: 'bg-green-100 text-green-600' };
      default:
        return { icon: FiAlertCircle, color: 'bg-red-100 text-gray-600' };
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // If impersonating, exit impersonation instead of logging out
      if (isImpersonating) {
        await exitImpersonation();
        toast.success('Exited impersonation mode');
        router.push('/super-admin');
      } else {
        // Normal logout
        await logout();
        toast.success('Logged out successfully');
        router.push('/login');
      }
    } catch (error) {
      toast.error(isImpersonating ? 'Failed to exit impersonation' : 'Failed to logout');
    }
  };

  const handleExitImpersonation = async () => {
    try {
      await exitImpersonation();
      toast.success('Exited impersonation mode');
      router.push('/super-admin');
    } catch (error) {
      toast.error('Failed to exit impersonation');
    }
  };

  // Debug: Log store values
  useEffect(() => {
    console.log('🔔 TopNavbar - Store values:', { 
      notificationsCount: notifications.length, 
      unreadCount,
      hasNotifications: notifications.length > 0 
    });
  }, [notifications, unreadCount]);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {organization && (
          <div>
            <h2 className="font-semibold text-gray-900">{organization.name}</h2>
            <p className="text-xs text-gray-500">
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasAdminPrivileges) ? 'Administrator' : 'Employee'}
            </p>
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Impersonation Warning */}
        {isImpersonating && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
            <FiAlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 font-medium">
              Impersonation Mode
            </span>
            <button
              onClick={handleExitImpersonation}
              className="ml-2 text-xs text-yellow-700 hover:text-yellow-900 underline"
            >
              Exit
            </button>
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fadeIn">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllAsReadMutation.mutate()}
                      disabled={markAllAsReadMutation.isPending}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const { icon: Icon, color } = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={notification._id}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsReadMutation.mutate(notification._id);
                          }
                          if (notification.taskId) {
                            router.push(`/${organization?.slug}/tasks`);
                            setShowNotifications(false);
                          }
                        }}
                        className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 ${
                          !notification.isRead ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <button 
                    onClick={() => {
                      setShowNotifications(false);
                      router.push(`/${organization?.slug}/notifications`);
                    }}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
          >
            <UserAvatar user={user} size="sm" />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </button>

          {/* Dropdown menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push(`/${organization?.slug}/settings`);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FiSettings className="w-4 h-4" />
                Settings
              </button>

              <div className="border-t border-gray-200 my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                {isImpersonating ? 'Exit Impersonation' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
