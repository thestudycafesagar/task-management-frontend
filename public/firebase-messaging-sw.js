// Service Worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration - Use actual values (env vars don't work in service workers)
firebase.initializeApp({
  apiKey: "AIzaSyBg7gQJH9r1XIoz354Y1qUsqmoGkj2halk",
  authDomain: "task-management-46a39.firebaseapp.com",
  projectId: "task-management-46a39",
  storageBucket: "task-management-46a39.firebasestorage.app",
  messagingSenderId: "210538641034",
  appId: "1:210538641034:web:2b34a114b8cbbde67e9f73",
  measurementId: "G-GQDVRY066F"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || '🔔 Task Management';
  
  // Map notification types to appropriate styling
  const typeConfig = {
    'TASK_ASSIGNED': { icon: '📋', badge: 'NEW', requireInteraction: true },
    'TASK_UPDATED': { icon: '🔄', badge: 'UPDATE', requireInteraction: false },
    'TASK_COMPLETED': { icon: '✅', badge: 'DONE', requireInteraction: false },
    'TASK_OVERDUE': { icon: '⚠️', badge: 'URGENT', requireInteraction: true }
  };

  const config = typeConfig[payload.data?.type] || { icon: '🔔', badge: '', requireInteraction: false };

  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.ico', // Your app logo
    badge: '/favicon.ico', // Small badge icon
    image: payload.notification?.image,
    data: {
      url: payload.data?.url || '/',
      notificationId: payload.data?.notificationId,
      taskId: payload.data?.taskId,
      type: payload.data?.type,
      timestamp: payload.data?.timestamp || Date.now()
    },
    requireInteraction: config.requireInteraction,
    tag: payload.data?.taskId ? `task-${payload.data.taskId}` : `notification-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: '👁️ View Task',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: '✖️ Dismiss'
      }
    ],
    timestamp: Date.now()
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle action buttons
  if (event.action === 'dismiss') {
    return;
  }

  // Open the app or focus existing window
  const urlToOpen = event.notification.data?.url || '/';
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if there's already a window open
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url.includes(urlToOpen) && 'focus' in client) {
        return client.focus();
      }
    }
    
    // If no window is open, open a new one
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

// Service worker activation - skip waiting to avoid caching
self.addEventListener('activate', (event) => {
  // Clear all caches on activation
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Service worker installation - no caching, FCM only
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

