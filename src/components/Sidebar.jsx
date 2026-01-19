'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import useAuthStore from '@/store/authStore';
import {
  FiHome,
  FiCheckSquare,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiX,
  FiBriefcase,
  FiBell,
} from 'react-icons/fi';

/**
 * Sidebar navigation component
 */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, organization, isImpersonating, hasAdminPrivileges } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingPath, setLoadingPath] = useState('');

  // Check if user has admin privileges (using backend flag)
  const isAdmin = hasAdminPrivileges || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Get base path (slug-based or default)
  const basePath = organization?.slug ? `/${organization.slug}` : '';

  const handleNavigation = (href) => {
    setLoadingPath(href);
    startTransition(() => {
      router.push(href);
    });
  };

  // Navigation items
  const navItems = [
    {
      label: 'Dashboard',
      icon: FiHome,
      href: `${basePath}/dashboard`,
      roles: ['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN'],
    },
    {
      label: 'Tasks',
      icon: FiCheckSquare,
      href: `${basePath}/tasks`,
      roles: ['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN'],
    },
    {
      label: 'Notifications',
      icon: FiBell,
      href: `${basePath}/notifications`,
      roles: ['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN'],
    },
    {
      label: 'Employees',
      icon: FiUsers,
      href: `${basePath}/employees`,
      roles: ['ADMIN', 'SUPER_ADMIN'],
      adminOnly: true,
    },
    {
      label: 'Analytics',
      icon: FiBarChart2,
      href: `${basePath}/analytics`,
      roles: ['ADMIN', 'SUPER_ADMIN'],
      adminOnly: true,
    },
    {
      label: 'Settings',
      icon: FiSettings,
      href: `${basePath}/settings`,
      roles: ['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN'],
    },
  ];

  // Super Admin items
  const superAdminItems = [
    {
      label: 'Organizations',
      icon: FiBriefcase,
      href: '/super-admin',
      roles: ['SUPER_ADMIN'],
    },
  ];

  // Filter based on role and admin access
  const filteredItems = navItems.filter((item) => {
    // If impersonating, grant full admin access
    if (isImpersonating) {
      return true; // Super admin impersonating gets all menu items
    }
    // Otherwise check role
    return item.roles.includes(user?.role);
  });
  const filteredSuperAdminItems = isSuperAdmin ? superAdminItems : [];

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isCollapsed ? <FiMenu className="w-6 h-6" /> : <FiX className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40',
          isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FiCheckSquare className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <span className="font-bold text-lg text-gray-900">TaskFlow</span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <div className="space-y-1">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isLoading = loadingPath === item.href;

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    disabled={isLoading}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100',
                      isCollapsed && 'justify-center',
                      isLoading && 'opacity-60 cursor-wait'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <Icon className="w-5 h-5 flex-shrink-0" />
                    )}
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Super Admin Section */}
            {filteredSuperAdminItems.length > 0 && (
              <div className="mt-6">
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">
                    Super Admin
                  </div>
                )}
                <div className="space-y-1">
                  {filteredSuperAdminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    const isLoading = loadingPath === item.href;

                    return (
                      <button
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        disabled={isLoading}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-100',
                          isCollapsed && 'justify-center',
                          isLoading && 'opacity-60 cursor-wait'
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <Icon className="w-5 h-5 flex-shrink-0" />
                        )}
                        {!isCollapsed && (
                          <span className="font-medium">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}
