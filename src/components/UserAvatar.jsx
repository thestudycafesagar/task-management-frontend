'use client';

import { cn, getInitials } from '@/lib/utils';

/**
 * User avatar component with modern styling
 */
export default function UserAvatar({ 
  user, 
  size = 'md',
  className 
}) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  // Modern, slightly muted colors that work well in SaaS UIs
  const colors = [
    'bg-blue-500/90',
    'bg-emerald-500/90',
    'bg-amber-500/90',
    'bg-rose-500/90',
    'bg-violet-500/90',
    'bg-pink-500/90',
    'bg-indigo-500/90',
    'bg-cyan-500/90',
    'bg-teal-500/90',
  ];

  // Generate consistent color based on user ID or email
  const colorIndex = user?.email 
    ? user.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length 
    : 0;

  // If user has a profile image, show it
  if (user?.profileImage) {
    return (
      <img
        src={user.profileImage}
        alt={user?.name || user?.email || 'User'}
        className={cn(
          'rounded-full object-cover ring-2 ring-background',
          sizeClasses[size],
          className
        )}
        title={user?.name || user?.email}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-medium shadow-sm',
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
