'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NavigationLoader from '@/components/NavigationLoader';
import { useSocketNotifications } from '@/hooks/useSocketNotifications';
import useFCMToken from '@/hooks/useFCMToken';
import { initNotificationCleanup } from '@/utils/cleanupServiceWorkers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      staleTime: 0, // Always consider data stale - allows immediate refetches
      cacheTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function SocketProvider({ children }) {
  useSocketNotifications();
  useFCMToken(); // Initialize FCM token registration
  
  // Cleanup old service workers on mount
  useEffect(() => {
    initNotificationCleanup();
  }, []);
  
  return <>{children}</>;
}

export default function ClientProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <NavigationLoader />
        {children}
      </SocketProvider>
    </QueryClientProvider>
  );
}
