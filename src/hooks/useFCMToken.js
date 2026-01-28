'use client';

import { useEffect, useState, useRef } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig, vapidKey } from '@/lib/firebase';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

/**
 * Hook to handle FCM token registration and push notifications
 */
export default function useFCMToken() {
  const { user, isAuthenticated, hasInitialized } = useAuthStore();
  const [token, setToken] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const hasAttemptedInit = useRef(false);

  useEffect(() => {
    // Only run in browser, if user is authenticated, and initialization is complete
    if (typeof window === 'undefined' || !isAuthenticated || !user || !hasInitialized) {
      return;
    }

    // Prevent multiple initialization attempts
    if (hasAttemptedInit.current) return;
    hasAttemptedInit.current = true;

    const initFCM = async () => {
      try {
        // Check current permission status
        const permission = Notification.permission;
        setNotificationPermission(permission);

        // Only register if already granted (don't auto-request)
        if (permission === 'granted') {
          console.log('✅ Notification permission already granted, registering FCM token...');
          await registerFCMToken();
        } else {
          console.log('⚠️  Notification permission not granted:', permission);
        }
      } catch (error) {
        console.error('❌ Error initializing FCM:', error);
      }
    };

    // Add a small delay to ensure everything else is ready
    const timeoutId = setTimeout(() => {
      initFCM();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [user, isAuthenticated, hasInitialized]);

  const registerFCMToken = async () => {
    try {
      console.log('🔧 Starting FCM token registration...');
      
      // Check if Firebase config is available
      if (!firebaseConfig.apiKey) {
        console.error('❌ Firebase config missing apiKey');
        return;
      }
      
      if (!vapidKey) {
        console.error('❌ VAPID key is missing!');
        return;
      }

      console.log('✅ Firebase config validated');

      // Initialize Firebase (avoid duplicate initialization)
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        console.log('✅ Firebase app initialized');
      } else {
        app = getApps()[0];
        console.log('✅ Using existing Firebase app');
      }

      const messaging = getMessaging(app);
      console.log('✅ Firebase messaging instance created');

      // Register service worker
      if ('serviceWorker' in navigator) {
        console.log('🔧 Registering service worker (FCM only, no caching)...');
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker registered and ready');

        // Get FCM token
        console.log('🔧 Requesting FCM token...');
        const currentToken = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          console.log('✅ FCM Token obtained successfully');
          setToken(currentToken);

          // Send token to backend
          console.log('🔧 Sending token to backend...');
          const response = await apiClient.post('/users/fcm-token', { fcmToken: currentToken });
          console.log('✅ FCM Token registered with backend');
        } else {
          console.error('❌ No FCM token available. This may mean:');
          console.log('   - Notification permission was denied');
          console.log('   - Service worker failed to register');
          console.log('   - VAPID key is incorrect');
        }

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          console.log('📨 Foreground message received:', payload);
          
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
        
        console.log('✅ Foreground message listener registered');
      } else {
        console.error('❌ Service Worker not supported in this browser');
      }
    } catch (error) {
      console.error('❌ Error registering FCM token:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
    }
  };

  return {
    token,
    notificationPermission,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    registerFCMToken, // Expose for manual triggering
  };
}

