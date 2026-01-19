'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import GlobalLoader from '@/components/GlobalLoader';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchUser, user, organization, hasInitialized } = useAuthStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetched.current && !hasInitialized) {
      hasFetched.current = true;
      fetchUser().catch(() => {
        // Silently fail, will redirect to login below
      });
    }
  }, []);

  useEffect(() => {
    // Only redirect after initialization is complete
    if (hasInitialized && !isLoading) {
      if (isAuthenticated && user) {
        if (user.role === 'SUPER_ADMIN') {
          router.replace('/super-admin');
        } else if (organization?.slug) {
          router.replace(`/${organization.slug}/dashboard`);
        } else {
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [hasInitialized, isLoading, isAuthenticated, user, organization, router]);

  return <GlobalLoader message="Loading..." />;
}
