'use client';

import { useState, useEffect } from 'react';
import useFCMToken from '@/hooks/useFCMToken';
import { FiBell, FiBellOff, FiInfo, FiCheck } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

export default function NotificationSettings() {
  const { 
    notificationPermission, 
    isSupported, 
    requestNotificationPermission 
  } = useFCMToken();
  
  const [loading, setLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      await requestNotificationPermission();
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionStatus = () => {
    switch (notificationPermission) {
      case 'granted':
        return {
          icon: <FiCheck className="w-5 h-5 text-green-500" />,
          text: 'Enabled',
          description: 'You\'ll receive task notifications',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'denied':
        return {
          icon: <FiBellOff className="w-5 h-5 text-red-500" />,
          text: 'Blocked',
          description: 'Enable in your browser settings',
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <FiBell className="w-5 h-5 text-yellow-500" />,
          text: 'Not Set',
          description: 'Click to enable notifications',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FiInfo className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-700">Notifications Not Supported</p>
            <p className="text-xs text-gray-500">Your browser doesn't support push notifications</p>
          </div>
        </div>
      </div>
    );
  }

  const status = getPermissionStatus();

  return (
    <div className={`${status.bgColor} border ${status.borderColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status.icon}
          <div>
            <p className={`text-sm font-medium ${status.color}`}>
              Push Notifications: {status.text}
            </p>
            <p className="text-xs text-gray-600">{status.description}</p>
          </div>
        </div>
        
        {notificationPermission === 'default' && (
          <Button
            onClick={handleEnableNotifications}
            disabled={loading}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? 'Enabling...' : 'Enable'}
          </Button>
        )}
        
        {notificationPermission === 'denied' && (
          <Button
            onClick={() => {
              alert('To enable notifications:\n\n1. Click the lock icon in your browser address bar\n2. Change notifications to "Allow"\n3. Refresh this page');
            }}
            size="sm"
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            How to Enable
          </Button>
        )}
      </div>
    </div>
  );
}