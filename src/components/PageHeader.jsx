'use client';

import { cn } from '@/lib/utils';

/**
 * Page header component
 */
export default function PageHeader({ 
  title, 
  description, 
  action,
  className 
}) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
