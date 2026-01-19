'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import GlobalLoader from '@/components/GlobalLoader';

export default function SuperAdminLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchUser, user, hasInitialized, isImpersonating, organization } = useAuthStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fetch if not initialized and haven't fetched yet
    if (!hasFetched.current && !hasInitialized && !isAuthenticated) {
      hasFetched.current = true;
      fetchUser().catch(() => {
        router.push('/super-admin/login');
      });
    }
  }, []);

  useEffect(() => {
    // Wait for initialization before checking auth
    if (hasInitialized && !isLoading) {
      if (isAuthenticated) {
        // If impersonating, redirect to organization dashboard
        if (isImpersonating && organization) {
          router.push(`/${organization.slug}/dashboard`);
          return;
        }
        
        // Verify user is super admin
        if (user?.role !== 'SUPER_ADMIN') {
          // Not a super admin, redirect based on role
          if (user?.organizationId) {
            router.push('/login');
          } else {
            router.push('/super-admin/login');
          }
        }
      } else {
        router.push('/super-admin/login');
      }
    }
  }, [hasInitialized, isLoading, isAuthenticated, user, router, isImpersonating, organization]);

  // Show loader while loading or not yet initialized
  if (isLoading || !hasInitialized) {
    return <GlobalLoader message="Loading..." />;
  }

  if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
    return null; // Will redirect above
  }

  return <>{children}</>;
}
