'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FiChevronDown } from 'react-icons/fi';

const DropdownContext = React.createContext({});

function DropdownMenu({ children }) {
  const [open, setOpen] = React.useState(false);
  
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function DropdownMenuTrigger({ asChild, children, className, ...props }) {
  const { open, setOpen } = React.useContext(DropdownContext);
  const ref = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);

  const handleClick = () => {
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return (
      <span ref={ref}>
        {React.cloneElement(children, {
          ...props,
          onClick: (e) => {
            handleClick();
            children.props.onClick?.(e);
          },
        })}
      </span>
    );
  }

  return (
    <button ref={ref} onClick={handleClick} className={className} {...props}>
      {children}
    </button>
  );
}

function DropdownMenuContent({ align = 'end', className, children, ...props }) {
  const { open, setOpen } = React.useContext(DropdownContext);

  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-fadeIn',
        align === 'end' && 'right-0',
        align === 'start' && 'left-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        'mt-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({ className, inset, onSelect, children, ...props }) {
  const { setOpen } = React.useContext(DropdownContext);

  return (
    <button
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
      onClick={() => {
        onSelect?.();
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuLabel({ className, inset, ...props }) {
  return (
    <div
      className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }) {
  return <div className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />;
}

function DropdownMenuShortcut({ className, ...props }) {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
};
