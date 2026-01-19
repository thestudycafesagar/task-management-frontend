'use client';

import { cn, getInitials } from '@/lib/utils';

/**
 * User avatar component
 */
export default function UserAvatar({ 
  user, 
  size = 'md',
  className 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];

  // Generate consistent color based on user ID or email
  const colorIndex = user?.email 
    ? user.email.charCodeAt(0) % colors.length 
    : 0;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-semibold',
        sizeClasses[size],
        colors[colorIndex],
        className
      )}
      title={user?.name || user?.email}
    >
      {getInitials(user?.name || user?.email)}
    </div>
  );
}
