'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FiX } from 'react-icons/fi';

const SheetContext = React.createContext({});

function Sheet({ open, onOpenChange, children }) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({ asChild, children, ...props }) {
  const { onOpenChange } = React.useContext(SheetContext);
  
  const handleClick = () => {
    onOpenChange?.(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e) => {
        handleClick();
        children.props.onClick?.(e);
      },
    });
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

function SheetPortal({ children }) {
  const { open } = React.useContext(SheetContext);
  
  if (!open) return null;
  
  return typeof document !== 'undefined'
    ? React.createPortal(children, document.body)
    : null;
}

function SheetOverlay({ className, ...props }) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black/80 animate-fadeIn',
        className
      )}
      {...props}
    />
  );
}

const sheetVariants = {
  right: 'inset-y-0 right-0 h-full w-3/4 sm:max-w-xl border-l translate-x-0 animate-slideIn',
  left: 'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm border-r',
  top: 'inset-x-0 top-0 border-b',
  bottom: 'inset-x-0 bottom-0 border-t',
};

function SheetContent({ side = 'right', className, children, ...props }) {
  const { onOpenChange } = React.useContext(SheetContext);

  return (
    <SheetPortal>
      <SheetOverlay onClick={() => onOpenChange?.(false)} />
      <div
        className={cn(
          'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out',
          sheetVariants[side],
          className
        )}
        {...props}
      >
        {children}
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <FiX className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }) {
  return (
    <h2
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}

function SheetClose({ asChild, children, ...props }) {
  const { onOpenChange } = React.useContext(SheetContext);

  const handleClick = () => {
    onOpenChange?.(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e) => {
        handleClick();
        children.props.onClick?.(e);
      },
    });
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
