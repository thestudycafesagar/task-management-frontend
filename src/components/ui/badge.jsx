'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground',
  success: 'border-transparent bg-success text-success-foreground',
  warning: 'border-transparent bg-warning text-warning-foreground',
  danger: 'border-transparent bg-danger text-danger-foreground',
  outline: 'bg-card text-foreground',
};

function Badge({ className, variant = 'secondary', ...props }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
