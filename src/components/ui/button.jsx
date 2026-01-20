'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  variant: {
    default: 'bg-primary text-primary-foreground shadow-soft hover:shadow-card hover:bg-primary/95',
    primary: 'bg-primary text-primary-foreground shadow-soft hover:shadow-card hover:bg-primary/95',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
    outline: 'border border-input bg-card hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/92',
    link: 'text-primary underline-offset-4 hover:underline',
  },
  size: {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  },
};

const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-[transform,colors,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
