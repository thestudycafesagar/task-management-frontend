'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NavigationLoader from '@/components/NavigationLoader';
import { useSocketNotifications } from '@/hooks/useSocketNotifications';
import useFCMToken from '@/hooks/useFCMToken';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnReconnect: true, // Refetch when internet reconnects
      refetchOnMount: true, // Refetch when component mounts
      staleTime: 0, // Data considered stale immediately for instant updates
      cacheTime: 1000 * 60 * 5, // Keep unused data in cache for 5 minutes
      retry: 1,
    },
  },
});

function SocketProvider({ children }) {
  useSocketNotifications();
  useFCMToken(); // Initialize FCM token registration
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
