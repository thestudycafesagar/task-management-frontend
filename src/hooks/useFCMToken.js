'use client';

import { useEffect, useState, useRef } from 'react';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig, vapidKey } from '@/lib/firebase';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Hook to handle FCM token registration and push notifications
 */
export default function useFCMToken() {
  const { user, isAuthenticated, hasInitialized } = useAuthStore();
  const [token, setToken] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const hasAttemptedInit = useRef(false);
  const lastRegisteredToken = useRef(null);

  // Reset initialization flag when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      hasAttemptedInit.current = false;
      lastRegisteredToken.current = null;
    }
  }, [user]);

  useEffect(() => {
    // Only run in browser, if user is authenticated, and initialization is complete
    if (typeof window === 'undefined' || !isAuthenticated || !user || !hasInitialized) {
      return;
    }

    // Prevent multiple initialization attempts for the same user session
    if (hasAttemptedInit.current) return;
    hasAttemptedInit.current = true;

    const initFCM = async () => {
      try {
        // Check current permission status
        const permission = Notification.permission;
        setNotificationPermission(permission);

        // Only register if already granted (don't auto-request)
        if (permission === 'granted') {
          if (isDev) console.log('Notification permission granted, registering FCM token...');
          await registerFCMToken();
        } else {
          if (isDev) console.log('Notification permission not granted:', permission);
        }
      } catch (error) {
        console.error('Error initializing FCM:', error);
      }
    };

    // Add a small delay to ensure everything else is ready
    const timeoutId = setTimeout(() => {
      initFCM();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [user, isAuthenticated, hasInitialized]);

  const registerFCMToken = async () => {
    try {
      if (isDev) console.log('Starting FCM token registration...');
      
      // Check if Firebase config is available
      if (!firebaseConfig.apiKey) {
        console.error('Firebase config missing apiKey');
        return;
      }
      
      if (!vapidKey) {
        console.error('VAPID key is missing!');
        return;
      }

      // Initialize Firebase (avoid duplicate initialization)
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        if (isDev) console.log('Firebase app initialized');
      } else {
        app = getApps()[0];
      }

      const messaging = getMessaging(app);

      // Register service worker
      if ('serviceWorker' in navigator) {
        if (isDev) console.log('Registering service worker...');
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        await navigator.serviceWorker.ready;

        // Get FCM token
        const currentToken = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          if (isDev) console.log('FCM Token obtained successfully');
          setToken(currentToken);

          // Send token to backend
          await apiClient.post('/users/fcm-token', { fcmToken: currentToken });
          if (isDev) console.log('FCM Token registered with backend');
        } else {
          console.error('No FCM token available');
        }

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          if (isDev) console.log('Foreground message received:', payload);
          
          if (payload.notification) {
            // Show toast notification
            toast.success(payload.notification.title, {
              description: payload.notification.body,
              duration: 5000,
            });
            
            // Also show browser notification with professional styling
            if (Notification.permission === 'granted') {
              const typeConfig = {
                'TASK_ASSIGNED': { icon: '📋', requireInteraction: true },
                'TASK_UPDATED': { icon: '🔄', requireInteraction: false },
                'TASK_COMPLETED': { icon: '✅', requireInteraction: false },
                'TASK_OVERDUE': { icon: '⚠️', requireInteraction: true }
              };

              const config = typeConfig[payload.data?.type] || { icon: '🔔', requireInteraction: false };

              new Notification(payload.notification.title, {
                body: payload.notification.body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: payload.data?.taskId ? `task-${payload.data.taskId}` : undefined,
                requireInteraction: config.requireInteraction,
                data: payload.data,
                vibrate: [200, 100, 200],
                timestamp: Date.now()
              });
            }
          }
        });
        
        if (isDev) console.log('Foreground message listener registered');
      } else {
        console.error('Service Worker not supported in this browser');
      }
    } catch (error) {
      console.error('Error registering FCM token:', error.message || error);
    }
  };

  return {
    token,
    notificationPermission,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    registerFCMToken, // Expose for manual triggering
  };
}

