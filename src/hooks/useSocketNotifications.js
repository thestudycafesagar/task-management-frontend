'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initializeSocket, disconnectSocket, getSocket } from '@/lib/socket';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export const useSocketNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Only try to connect if user is authenticated AND token exists
    if (!isAuthenticated || !user) {
      disconnectSocket();
      reconnectAttempts.current = 0;
      return;
    }

    // Get token from cookies
    const token = Cookies.get('token');
    if (!token) {
      // Don't log warning on initial load - just wait for login
      return;
    }

    // Initialize socket connection
    let socket;
    try {
      socket = initializeSocket(token);
      reconnectAttempts.current = 0;
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      return;
    }

    // Handle connection success
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully');
      reconnectAttempts.current = 0;
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      reconnectAttempts.current++;
      console.error(`❌ Socket connection error (attempt ${reconnectAttempts.current}):`, error.message);
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Please check your network and server.');
        toast.error('Unable to connect to notification service. Please refresh the page.', {
          duration: 5000,
          position: 'top-center'
        });
      }
    });

    // Listen for new notifications
    socket.on('notification', (notification) => {
      console.log('📩 New notification received:', notification);
      
      // Add to store
      addNotification(notification);

      // Show toast notification
      toast(notification.message, {
        icon: '🔔',
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#3B82F6',
          color: '#fff',
          borderRadius: '12px',
          padding: '16px',
          fontWeight: '500'
        }
      });

      // Invalidate notifications query to refetch
      queryClient.invalidateQueries(['notifications']);
      
      // Invalidate task queries if it's task-related
      if (notification.taskId) {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['recent-tasks']);
        queryClient.invalidateQueries(['task-stats']);
      }
    });

    // Listen for task updates (real-time collaboration)
    socket.on('task-updated', (data) => {
      console.log('📝 Task updated by:', data.updatedBy);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['recent-tasks']);
      queryClient.invalidateQueries(['task-stats']);
    });

    // Listen for new tasks created
    socket.on('task-created', (data) => {
      console.log('✨ New task created by:', data.createdBy);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['recent-tasks']);
      queryClient.invalidateQueries(['task-stats']);
      
      // Show toast if not the creator
      if (data.createdBy !== user?.email) {
        toast('New task assigned', {
          icon: '📋',
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontWeight: '500'
          }
        });
      }
    });

    // Listen for tasks deleted
    socket.on('task-deleted', (data) => {
      console.log('🗑️ Task deleted by:', data.deletedBy);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['recent-tasks']);
      queryClient.invalidateQueries(['task-stats']);
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
    };
  }, [isAuthenticated, user, addNotification, queryClient]);
};

export default useSocketNotifications;
