'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import GlobalLoader from '@/components/GlobalLoader';

export default function SlugPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Redirect to dashboard
    router.push(`/${params.slug}/dashboard`);
  }, [params.slug, router]);

  return <GlobalLoader message="Redirecting to dashboard..." />;
}
