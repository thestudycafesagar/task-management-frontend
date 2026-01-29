'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initializeSocket, disconnectSocket, getSocket } from '@/lib/socket';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const isDev = process.env.NODE_ENV !== 'production';

// Debounce helper
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const useSocketNotifications = () => {
  const { isAuthenticated, user, hasInitialized, token } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const hasConnected = useRef(false);
  const lastNotificationId = useRef(null);
  const lastTaskUpdateTime = useRef(0);

  // Debounced refetch to prevent cascading API calls
  const debouncedRefetch = useCallback(
    debounce(() => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, 500),
    [queryClient]
  );

  useEffect(() => {
    // Only try to connect if:
    // 1. User is authenticated
    // 2. User object exists
    // 3. Auth initialization is complete
    // 4. Token is available
    if (!isAuthenticated || !user || !hasInitialized || !token) {
      disconnectSocket();
      reconnectAttempts.current = 0;
      hasConnected.current = false;
      return;
    }

    // Prevent multiple connection attempts
    if (hasConnected.current) return;

    // Add a small delay to ensure everything is ready
    const timeoutId = setTimeout(() => {
      hasConnected.current = true;
      
      // Initialize socket connection
      let socket;
      try {
        socket = initializeSocket(token);
        reconnectAttempts.current = 0;
      } catch (error) {
        console.error('Socket initialization failed:', error);
        hasConnected.current = false;
        return;
      }

      // Handle connection success
      socket.on('connect', () => {
        reconnectAttempts.current = 0;
      });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      reconnectAttempts.current++;
      if (isDev) console.error(`Socket connection error (attempt ${reconnectAttempts.current}):`, error.message);
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        toast.error('Unable to connect to notification service. Please refresh the page.', {
          duration: 5000,
          position: 'top-center'
        });
      }
    });

    // Listen for new notifications - THIS IS THE PRIMARY NOTIFICATION SOURCE
    socket.on('notification', (notification) => {
      // Deduplicate notifications
      if (notification._id && notification._id === lastNotificationId.current) {
        if (isDev) console.log('Duplicate notification ignored:', notification._id);
        return;
      }
      lastNotificationId.current = notification._id;

      // Add to store
      addNotification(notification);

      // Show toast notification
      toast(notification.message, {
        icon: '🔔',
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#3B82F6',
          color: '#fff',
          borderRadius: '12px',
          padding: '16px',
          fontWeight: '500'
        }
      });

      // Debounced refetch to prevent API flooding
      debouncedRefetch();
    });

    // Listen for task updates (real-time collaboration) - NO TOAST HERE (handled by notification event)
    socket.on('task-updated', (data) => {
      // Throttle task updates to prevent cascading
      const now = Date.now();
      if (now - lastTaskUpdateTime.current < 300) {
        if (isDev) console.log('Task update throttled');
        return;
      }
      lastTaskUpdateTime.current = now;

      // Use debounced refetch instead of immediate invalidation
      debouncedRefetch();
      
      // NOTE: Toast notifications are handled by the 'notification' event
      // Don't show duplicate toasts here
    });

    // Listen for new tasks created - NO TOAST (handled by notification event)
    socket.on('task-created', (data) => {
      // Use debounced refetch
      debouncedRefetch();
      // NOTE: Toast notifications are handled by the 'notification' event
    });

    // Listen for tasks deleted
    socket.on('task-deleted', (data) => {
      // Use debounced refetch
      debouncedRefetch();
      
      // Show toast notification for delete (no notification event for deletes)
      if (data.deletedBy !== user?.email) {
        toast('A task was deleted', {
          icon: '🗑️',
          duration: 2000,
          position: 'top-right'
        });
      }
    });

    // Cleanup on unmount
    return () => {
      const currentSocket = getSocket();
      if (currentSocket) {
        currentSocket.off('notification');
        currentSocket.off('task-updated');
        currentSocket.off('task-created');
        currentSocket.off('task-deleted');
      }
      hasConnected.current = false;
    };
    }, 1000); // 1 second delay to ensure auth is complete

    return () => {
      clearTimeout(timeoutId);
      disconnectSocket();
      hasConnected.current = false;
    };
  }, [isAuthenticated, user, hasInitialized, token, addNotification, queryClient]);
};

export default useSocketNotifications;
