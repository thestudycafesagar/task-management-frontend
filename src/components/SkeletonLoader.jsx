'use client';

import { cn } from '@/lib/utils';

/**
 * Skeleton loader component with modern styling
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('skeleton rounded-lg', className)}
      {...props}
    />
  );
}

/**
 * Card skeleton
 */
export function CardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <Skeleton className="h-6 w-3/4 rounded-md" />
      <Skeleton className="h-4 w-full rounded-md" />
      <Skeleton className="h-4 w-5/6 rounded-md" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Table skeleton
 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

/**
 * List skeleton
 */
export function ListSkeleton({ items = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
