'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show loader when navigation starts
    setLoading(true);

    // Hide loader after a short delay (when page is rendered)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <>
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999]">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-progress shadow-lg"></div>
      </div>

      {/* Full Screen Loader with Blur Background */}
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-white/60 backdrop-blur-sm">
        <div className="relative">
          {/* Spinner */}
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </>
  );
}
