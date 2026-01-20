'use client';

import { cn } from '@/lib/utils';

/**
 * Global loader component - Full screen loading indicator with modern styling
 */
export default function GlobalLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}
