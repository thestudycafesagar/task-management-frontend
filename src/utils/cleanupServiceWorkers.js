/**
 * Service Worker Cleanup Utility
 * Cleans up old service workers from previous deployments (localhost, Vercel, Netlify)
 * to prevent notification conflicts and stale caches.
 */

/**
 * Unregister all service workers except the current production one
 */
export async function cleanupOldServiceWorkers() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { cleaned: 0, errors: [] };
  }

  const currentOrigin = window.location.origin;
  const productionDomains = [
    'sagarn8n.codes',
    'https://sagarn8n.codes'
  ];
  
  const isProductionDomain = productionDomains.some(domain => 
    currentOrigin.includes(domain)
  );

  let cleaned = 0;
  const errors = [];

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    console.log(`🔧 Found ${registrations.length} service worker registration(s)`);
    
    for (const registration of registrations) {
      const swScope = registration.scope;
      
      // Check if this is an old/stale service worker
      const isLocalhost = swScope.includes('localhost');
      const isVercel = swScope.includes('vercel.app');
      const isNetlify = swScope.includes('netlify.app');
      const isDifferentOrigin = !swScope.startsWith(currentOrigin);
      
      // In production, clean up localhost/Vercel/Netlify workers
      // In development, clean up production workers
      const shouldClean = isProductionDomain 
        ? (isLocalhost || isVercel || isNetlify)
        : (!isLocalhost && (isVercel || isNetlify));
      
      if (shouldClean || isDifferentOrigin) {
        console.log(`🧹 Unregistering stale service worker: ${swScope}`);
        try {
          await registration.unregister();
          cleaned++;
        } catch (err) {
          errors.push({ scope: swScope, error: err.message });
        }
      }
    }
    
    console.log(`✅ Cleaned ${cleaned} stale service worker(s)`);
  } catch (error) {
    console.error('❌ Error cleaning service workers:', error);
    errors.push({ scope: 'global', error: error.message });
  }

  return { cleaned, errors };
}

/**
 * Clear all FCM-related IndexedDB databases
 */
export async function clearFCMDatabases() {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return { cleared: 0, errors: [] };
  }

  const fcmDatabases = [
    'firebase-messaging-database',
    'firebase-installations-database',
    'fcm_token_details_db',
    'firebase-messaging-store'
  ];

  let cleared = 0;
  const errors = [];

  for (const dbName of fcmDatabases) {
    try {
      await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => {
          console.log(`✅ Deleted IndexedDB: ${dbName}`);
          cleared++;
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
        request.onblocked = () => {
          console.warn(`⚠️ IndexedDB ${dbName} is blocked`);
          resolve(); // Continue anyway
        };
      });
    } catch (error) {
      // Database might not exist, which is fine
      if (!error.message?.includes('not found')) {
        errors.push({ database: dbName, error: error.message });
      }
    }
  }

  return { cleared, errors };
}

/**
 * Full cleanup - service workers + FCM databases
 */
export async function fullNotificationCleanup() {
  console.log('🔧 Starting full notification cleanup...');
  
  const swResult = await cleanupOldServiceWorkers();
  const dbResult = await clearFCMDatabases();
  
  console.log('✅ Notification cleanup complete:', {
    serviceWorkersCleared: swResult.cleaned,
    databasesCleared: dbResult.cleared,
    errors: [...swResult.errors, ...dbResult.errors]
  });
  
  return {
    serviceWorkers: swResult,
    databases: dbResult
  };
}

/**
 * Initialize cleanup on page load (call this in your app layout)
 */
export function initNotificationCleanup() {
  if (typeof window === 'undefined') return;
  
  // Run cleanup after a short delay to not block initial render
  setTimeout(() => {
    fullNotificationCleanup().catch(console.error);
  }, 2000);
}

export default {
  cleanupOldServiceWorkers,
  clearFCMDatabases,
  fullNotificationCleanup,
  initNotificationCleanup
};
