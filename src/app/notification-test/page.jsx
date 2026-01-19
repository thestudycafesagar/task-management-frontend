'use client';

import { useEffect, useState } from 'react';
import { FiBell, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/api';
import useFCMToken from '@/hooks/useFCMToken';

export default function NotificationTestPage() {
  const { user } = useAuthStore();
  const { registerFCMToken } = useFCMToken();
  const [status, setStatus] = useState({
    permission: 'default',
    serviceWorker: false,
    fcmToken: null,
    backendTokens: [],
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkNotificationStatus();
  }, [user]);

  const checkNotificationStatus = async () => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    // Check notification permission
    const permission = 'Notification' in window ? Notification.permission : 'not-supported';
    
    // Check service worker
    const swRegistration = await navigator.serviceWorker?.getRegistration();
    
    // Get tokens from backend
    let backendTokens = [];
    if (user) {
      try {
        const response = await apiClient.get('/users/profile');
        backendTokens = response.data.data.user.fcmTokens || [];
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      }
    }

    setStatus({
      permission,
      serviceWorker: !!swRegistration,
      fcmToken: null,
      backendTokens,
    });
  };

  const requestPermission = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const permission = await Notification.requestPermission();
      setStatus(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        // Trigger FCM token registration
        await registerFCMToken();
        
        // Wait a bit then refresh status
        setTimeout(() => {
          checkNotificationStatus();
          alert('✅ Permission granted! Check if tokens are registered below.');
        }, 2000);
      } else {
        alert('❌ Permission denied. Please reset in browser settings.');
      }
    } catch (error) {
      alert('❌ Error requesting permission: ' + error.message);
    }
  };

  const sendTestNotification = async () => {
    if (typeof window === 'undefined') return;
    
    if (Notification.permission !== 'granted') {
      alert('Please enable notifications first!');
      return;
    }

    // Send browser notification
    new Notification('Test Notification', {
      body: 'This is a test notification from your Task Management app!',
      icon: '/icon-192x192.png',
    });
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🔔 Push Notification Diagnostics</h1>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔔 Push Notification Diagnostics</h1>

        {/* Permission Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FiBell className="w-6 h-6" />
            Browser Permission Status
          </h2>
          
          <div className="space-y-3">
            <StatusItem
              label="Notification API"
              status={'Notification' in window ? 'supported' : 'not-supported'}
              details="Browser supports web notifications"
            />
            
            <StatusItem
              label="Permission Status"
              status={status.permission}
              details={
                status.permission === 'granted' ? 'You can receive notifications' :
                status.permission === 'denied' ? 'You blocked notifications. Reset in browser settings.' :
                'Permission not yet requested'
              }
            />

            <StatusItem
              label="Service Worker"
              status={status.serviceWorker ? 'registered' : 'not-registered'}
              details="Required for background notifications"
            />

            <StatusItem
              label="FCM Tokens in Database"
              status={status.backendTokens.length > 0 ? 'registered' : 'none'}
              details={`${status.backendTokens.length} device(s) registered`}
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            {status.permission !== 'granted' && (
              <button
                onClick={requestPermission}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Enable Push Notifications
              </button>
            )}
            
            {status.permission === 'granted' && (
              <button
                onClick={sendTestNotification}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Send Test Notification
              </button>
            )}

            <button
              onClick={checkNotificationStatus}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
            >
              Refresh Status
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click "Enable Push Notifications" above</li>
            <li>Click "Allow" when browser asks for permission</li>
            <li>Refresh this page to register FCM token</li>
            <li>Check "FCM Tokens in Database" shows "1 device(s)"</li>
            <li>Click "Send Test Notification" to verify</li>
            <li>Go back to app and have someone assign you a task</li>
          </ol>
        </div>

        {/* Token Details */}
        {status.backendTokens.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-3">Registered Devices:</h3>
            <div className="space-y-2">
              {status.backendTokens.map((token, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded font-mono text-xs break-all">
                  Device {index + 1}: {token.substring(0, 50)}...
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusItem({ label, status, details }) {
  const getStatusColor = () => {
    if (status === 'granted' || status === 'supported' || status === 'registered') {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    if (status === 'denied' || status === 'not-supported') {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  const getIcon = () => {
    if (status === 'granted' || status === 'supported' || status === 'registered') {
      return <FiCheck className="w-5 h-5" />;
    }
    if (status === 'denied' || status === 'not-supported') {
      return <FiX className="w-5 h-5" />;
    }
    return <FiAlertCircle className="w-5 h-5" />;
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="font-semibold">{label}</div>
        <div className="text-sm mt-1">{details}</div>
        <div className="text-xs mt-1 font-mono">{status}</div>
      </div>
    </div>
  );
}
