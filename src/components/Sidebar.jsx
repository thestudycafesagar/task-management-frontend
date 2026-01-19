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
  FiTrendingUp,
  FiList,
  FiActivity,
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
    // Prevent navigation if already navigating
    if (loadingPath) return;
    
    setLoadingPath(href);
    startTransition(() => {
      router.push(href);
      // Clear loading state after navigation
      setTimeout(() => setLoadingPath(''), 500);
    });
  };

  // Check if user is employee (any role that is NOT admin/super-admin)
  // This will work for Developer, Designer, Manager, or any custom employee role
  const isEmployee = user && !hasAdminPrivileges && !isAdmin && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN';

  console.log('🔍 Sidebar Debug:', {
    userRole: user?.role,
    isEmployee,
    isAdmin,
    hasAdminPrivileges,
    isImpersonating
  });

  // Employee Dashboard Tabs (sub-items) - Show for any non-admin user
  const employeeDashboardTabs = isEmployee ? [
    {
      label: 'Overview',
      icon: FiTrendingUp,
      href: `${basePath}/dashboard`,
    },
    {
      label: 'Activity',
      icon: FiActivity,
      href: `${basePath}/dashboard?tab=activity`,
    },
  ] : undefined;

  console.log('📋 Dashboard tabs config:', {
    isEmployee,
    hasSubItems: !!employeeDashboardTabs,
    tabsCount: employeeDashboardTabs?.length || 0
  });

  // Navigation items
  const navItems = [
    {
      label: 'Dashboard',
      icon: FiHome,
      href: `${basePath}/dashboard`,
      roles: ['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN'],
      subItems: employeeDashboardTabs, // Already conditionally set above
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
    
    // If admin-only item and user is not admin, hide it
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    
    // For non-admin-only items, show to everyone who is logged in
    // This includes all employees regardless of exact role name
    return !item.adminOnly || item.roles.includes(user?.role);
  });
  
  console.log('🎯 Filtered items:', filteredItems.map(i => ({
    label: i.label,
    hasSubItems: !!i.subItems,
    subItemsCount: i.subItems?.length || 0
  })));
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
                // Check if we're on a page that belongs to this item
                const isOnItemPage = pathname.startsWith(item.href.split('?')[0]);
                const isLoading = loadingPath === item.href;
                
                // For items without sub-items, check exact match
                // For items with sub-items, just check if we're on that section
                const isActive = item.subItems ? false : pathname === item.href;
                const isParentActive = item.subItems && isOnItemPage;

                return (
                  <div key={item.href}>
                    <button
                      onClick={(e) => {
                        if (loadingPath) {
                          e.preventDefault();
                          return;
                        }
                        handleNavigation(item.href);
                      }}
                      disabled={isLoading || !!loadingPath}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary text-white'
                          : isParentActive
                          ? 'bg-gray-100 text-gray-900'
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

                    {/* Sub-items for Employee Dashboard */}
                    {item.subItems && !isCollapsed && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                        {console.log('🎨 Rendering sub-items for:', item.label, 'Count:', item.subItems.length)}
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          // Check if this sub-item is active
                          let isSubActive = false;
                          if (subItem.href.includes('?tab=')) {
                            // For tab-based navigation
                            const tabParam = subItem.href.split('?tab=')[1];
                            const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
                            isSubActive = currentSearch.includes(`tab=${tabParam}`);
                          } else {
                            // For Overview (no tab parameter)
                            const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
                            isSubActive = pathname === subItem.href.split('?')[0] && !currentSearch.includes('tab=');
                          }
                          
                          const isSubLoading = loadingPath === subItem.href;

                          return (
                            <button
                              key={subItem.href}
                              onClick={(e) => {
                                if (loadingPath) {
                                  e.preventDefault();
                                  return;
                                }
                                handleNavigation(subItem.href);
                              }}
                              disabled={isSubLoading || !!loadingPath}
                              className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm',
                                isSubActive
                                  ? 'bg-primary text-white'
                                  : 'text-gray-600 hover:bg-gray-100',
                                isSubLoading && 'opacity-60 cursor-wait'
                              )}
                            >
                              {isSubLoading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                              ) : (
                                <SubIcon className="w-4 h-4 flex-shrink-0" />
                              )}
                              <span className="font-medium">{subItem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
                        onClick={(e) => {
                          if (loadingPath) {
                            e.preventDefault();
                            return;
                          }
                          handleNavigation(item.href);
                        }}
                        disabled={isLoading || !!loadingPath}
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
