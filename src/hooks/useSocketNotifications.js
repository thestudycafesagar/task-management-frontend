'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initializeSocket, disconnectSocket, getSocket } from '@/lib/socket';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export const useSocketNotifications = () => {
  const { isAuthenticated, user, hasInitialized, token } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const hasConnected = useRef(false);

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

      // FORCE immediate refetch instead of just invalidating
      queryClient.refetchQueries(['notifications']);
      
      // Invalidate task queries if it's task-related
      if (notification.taskId) {
        // Force refetch for instant UI update
        queryClient.refetchQueries(['tasks']);
        queryClient.refetchQueries(['recent-tasks']);
        queryClient.refetchQueries(['all-tasks']);
        queryClient.refetchQueries(['task-stats']);
        queryClient.refetchQueries(['analytics']);
      }
    });

    // Listen for task updates (real-time collaboration)
    socket.on('task-updated', (data) => {
      // Invalidate first, then refetch for instant UI update
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'tasks' 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'recent-tasks' 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'all-tasks' 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'task-stats' 
      });
      
      // Show toast notification for certain actions
      if (data.updatedBy !== user?.email) {
        const actionMessages = {
          'accepted': `✅ Task "${data.task?.title}" was accepted`,
          'started': `🚀 Work started on "${data.task?.title}"`,
          'submitted': `📤 Task "${data.task?.title}" was submitted`,
          'completed': `🎉 Task "${data.task?.title}" was completed`,
          'rejected': `⚠️ Task "${data.task?.title}" needs revision`
        };
        
        const message = actionMessages[data.action] || `Task "${data.task?.title}" was updated`;
        
        if (data.action && data.action !== 'comment-added') {
          toast(message, {
            icon: data.action === 'completed' ? '🎉' : '📝',
            duration: 3000,
            position: 'top-right'
          });
        }
      }
    });

    // Listen for new tasks created
    socket.on('task-created', (data) => {
      // Invalidate first, then refetch for instant UI update
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'tasks' 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'recent-tasks' 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'all-tasks' 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'task-stats' 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'analytics' 
      });
      
      // Show toast if not the creator
      if (data.createdBy !== user?.email) {
        toast(`New task: ${data.task?.title || 'Task assigned'}`, {
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
      // Invalidate first, then refetch for instant UI update
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'tasks' 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'recent-tasks' 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'all-tasks' 
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'task-stats' 
      });
      
      // Show toast notification
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
