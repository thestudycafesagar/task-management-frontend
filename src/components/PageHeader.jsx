'use client';

import { cn } from '@/lib/utils';

/**
 * Page header component with modern styling
 */
export default function PageHeader({ 
  title, 
  description, 
  action,
  className 
}) {
  return (
    <header className={cn('mb-6', className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </header>
  );
}
