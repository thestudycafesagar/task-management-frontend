'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NavigationLoader from '@/components/NavigationLoader';
import { useSocketNotifications } from '@/hooks/useSocketNotifications';
import useFCMToken from '@/hooks/useFCMToken';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
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
