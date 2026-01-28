'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show loader immediately when navigation starts
    setLoading(true);

    // Hide loader after page renders (shorter delay for snappier feel)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <>
      {/* Top Progress Bar - Non-blocking */}
      <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-progress shadow-lg"></div>
      </div>

      {/* Optional: Subtle overlay instead of full screen blur for better UX */}
      <div className="fixed inset-0 z-[9998] pointer-events-none bg-white/30 backdrop-blur-[2px]" />
    </>
  );
}
