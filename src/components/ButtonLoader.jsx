'use client';

import { cn } from '@/lib/utils';

/**
 * Button loader component with modern styling
 */
export default function ButtonLoader({ className = '', size = 'sm' }) {
  const sizeClasses = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-2',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'border-current border-t-transparent rounded-full animate-spin',
        sizeClasses[size]
      )}></div>
    </div>
  );
}
