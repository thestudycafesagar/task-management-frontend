'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Empty state component with modern styling
 */
export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel,
  className 
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && (
        <div className="w-16 h-16 bg-accent/50 rounded-2xl flex items-center justify-center mb-5">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
