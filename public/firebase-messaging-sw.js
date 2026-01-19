// Service Worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

console.log('🔧 Firebase Service Worker loaded');

// Firebase configuration - loaded from environment at build time
// Make sure these environment variables are set in your .env file
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: self.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: self.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: self.FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: self.FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID"
});

console.log('✅ Firebase initialized in Service Worker');

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📨 Received background message:', payload);

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

  console.log('🔔 Showing notification:', notificationTitle);

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event.notification);
  console.log('Action:', event.action);
  
  event.notification.close();

  // Handle action buttons
  if (event.action === 'dismiss') {
    console.log('User dismissed notification');
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
  console.log('✅ Service Worker activated');
  // Clear all caches on activation
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Service worker installation - no caching, FCM only
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker installed (FCM only, no caching)');
  self.skipWaiting();
});

