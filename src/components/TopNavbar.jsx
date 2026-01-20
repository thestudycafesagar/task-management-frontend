'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AiTwotoneNotification } from "react-icons/ai";
import { FiBell, FiLogOut, FiAlertCircle, FiSettings, FiClock, FiCheckCircle, FiMessageSquare, FiMenu } from 'react-icons/fi';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';
import { useSidebar } from './Sidebar';
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

  // Only show the latest 10 notifications in the dropdown
  const visibleNotifications = notifications.slice(0, 10);

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

  
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-6">
        {/* Mobile hamburger menu button */}
        <MobileMenuButton />

        {/* Left section - Organization info */}
        <div className="flex items-center gap-3">
          {/* Logo mark - hidden on mobile when hamburger is shown */}
          <div className="hidden lg:flex items-center">
            <div className="hidden lg:grid size-8 place-items-center rounded-full bg-gradient-primary shadow-soft overflow-hidden">
              <div className="w-8 h-8 rounded-full overflow-hidden grid place-items-center">
                <Image src="/logo.png" alt="TaskFlow" width={32} height={32} className="object-cover" />
              </div>
            </div>
          </div>
          {organization && (
            <div className="hidden md:block">
              <div className="text-sm font-semibold leading-tight text-foreground">{organization.name}</div>
              <div className="text-xs text-muted-foreground">
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasAdminPrivileges) ? 'Administrator' : 'Employee'}
              </div>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Impersonation Warning */}
        {isImpersonating && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/15 border border-warning/30 rounded-lg">
            <FiAlertCircle className="w-4 h-4 text-warning" />
            <span className="text-sm text-warning font-medium hidden sm:inline">
              Impersonation Mode
            </span>
            <button
              onClick={handleExitImpersonation}
              className="ml-2 text-xs text-warning hover:underline font-medium"
            >
              Exit
            </button>
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <FiBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-danger text-danger-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="fixed left-2 right-2 top-14 md:absolute md:top-auto md:mt-2 md:right-0 md:left-auto w-[calc(100vw-1rem)] md:w-96 bg-card rounded-xl shadow-float border border-border overflow-hidden z-50 animate-fadeIn">
              {/* Header */}
              <div className="px-4 py-3 border-b border-border bg-accent/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllAsReadMutation.mutate()}
                      disabled={markAllAsReadMutation.isPending}
                      className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50"
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
                    <FiBell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  visibleNotifications.map((notification) => {
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
                        className={`px-4 py-3 hover:bg-accent transition-colors cursor-pointer border-b border-border ${
                          !notification.isRead ? 'bg-accent/50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
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
                <div className="px-4 py-3 border-t border-border bg-accent/30">
                  <button 
                    onClick={() => {
                      setShowNotifications(false);
                      router.push(`/${organization?.slug}/notifications`);
                    }}
                    className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium"
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
            className="flex items-center gap-2 hover:bg-accent rounded-lg px-2 py-1.5 transition-colors"
          >
            <UserAvatar user={user} size="sm" />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </button>

          {/* Dropdown menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-card rounded-xl shadow-float border border-border py-1 z-50 animate-fadeIn">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push(`/${organization?.slug}/settings`);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <FiSettings className="w-4 h-4" />
                Settings
              </button>

              <div className="border-t border-border my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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

/**
 * Mobile menu button component - shows hamburger on mobile
 */
function MobileMenuButton() {
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  
  return (
    <button
      onClick={() => setIsMobileOpen(!isMobileOpen)}
      className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
      aria-label="Toggle menu"
    >
      <FiMenu className="w-5 h-5" />
    </button>
  );
}
