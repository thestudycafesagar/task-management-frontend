'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FiX } from 'react-icons/fi';

const DialogContext = React.createContext({});

function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({ asChild, children, ...props }) {
  const { onOpenChange } = React.useContext(DialogContext);
  
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

function DialogPortal({ children }) {
  const { open } = React.useContext(DialogContext);
  
  if (!open) return null;
  
  return typeof document !== 'undefined'
    ? React.createPortal(children, document.body)
    : null;
}

function DialogOverlay({ className, ...props }) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
}

function DialogContent({ className, children, ...props }) {
  const { onOpenChange } = React.useContext(DialogContext);

  return (
    <DialogPortal>
      <DialogOverlay onClick={() => onOpenChange?.(false)} />
      <div
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-xl animate-fadeIn',
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
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }) {
  return (
    <h2
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}

function DialogClose({ asChild, children, ...props }) {
  const { onOpenChange } = React.useContext(DialogContext);

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
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
