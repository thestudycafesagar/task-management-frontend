'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import GlobalLoader from '@/components/GlobalLoader';

export default function SlugLayout({ children }) {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading, fetchUser, organization, user, hasInitialized, isImpersonating, hasAdminPrivileges } = useAuthStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fetch if not initialized and haven't fetched yet
    if (!hasFetched.current && !hasInitialized && !isAuthenticated) {
      hasFetched.current = true;
      fetchUser().catch(() => {
        router.push('/login');
      });
    }
  }, []);

  useEffect(() => {
    // Wait for initialization before checking auth
    if (hasInitialized && !isLoading) {
      if (isAuthenticated) {
        // If impersonating, allow access to any slug (super admin has full control)
        if (isImpersonating && user?.role === 'SUPER_ADMIN') {
          console.log('🔓 Super admin impersonating - allowing access to:', params.slug);
          return; // Allow access - no redirect
        }
        
        // Verify slug matches organization for regular users
        if (organization && params.slug && params.slug !== organization.slug) {
          // Redirect to correct slug only for non-super-admin users
          if (user?.role === 'SUPER_ADMIN' && !isImpersonating) {
            router.push('/super-admin');
          } else if (user?.role !== 'SUPER_ADMIN') {
            // Only redirect regular users to their organization slug
            router.push(`/${organization.slug}/dashboard`);
          }
        }
      } else {
        router.push('/login');
      }
    }
  }, [hasInitialized, isLoading, isAuthenticated, organization, params.slug, user?.role, router, isImpersonating]);

  // Show loader while loading or not yet initialized
  if (isLoading || !hasInitialized) {
    return <GlobalLoader message="Loading..." />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect above
  }

  return <>{children}</>;
}
