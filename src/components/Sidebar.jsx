'use client';

import { useState, useTransition, createContext, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  FiActivity,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

// Context for sharing sidebar state
const SidebarContext = createContext({
  isCollapsed: false,
  setIsCollapsed: () => {},
  isMobileOpen: false,
  setIsMobileOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

// Provider component to wrap AppLayout
export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Sidebar navigation component
 */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, organization, isImpersonating, hasAdminPrivileges } = useAuthStore();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const [isPending, startTransition] = useTransition();
  const [loadingPath, setLoadingPath] = useState('');

  // Check if user has admin privileges (using backend flag)
  const isAdmin = hasAdminPrivileges || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Get base path (slug-based or default)
  const basePath = organization?.slug ? `/${organization.slug}` : '';

  const handleNavigation = (href) => {
    if (loadingPath) return;
    
    setLoadingPath(href);
    startTransition(() => {
      router.push(href);
      setIsMobileOpen(false);
      setTimeout(() => setLoadingPath(''), 500);
    });
  };

  // Check if user is employee (any role that is NOT admin/super-admin)
  // This will work for Developer, Designer, Manager, or any custom employee role
  const isEmployee = user && !hasAdminPrivileges && !isAdmin && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN';

  

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
  
  const filteredSuperAdminItems = isSuperAdmin ? superAdminItems : [];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-card border-r border-sidebar-border transition-all duration-300 z-40',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'lg:w-64 w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between border-b border-sidebar-border px-4">
            <div className="flex items-center gap-3">
              {/* Logo wrapper: round, fixed size */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-primary shadow-soft flex-shrink-0 grid place-items-center">
                <Image src="/logo.png" alt="TaskFlow Logo" width={40} height={40} className="object-cover" />
              </div>
              {!isCollapsed && (
                <span className="font-bold text-lg text-foreground whitespace-nowrap">TaskFlow</span>
              )}
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
            >
              <FiX className="w-5 h-5" />
            </button>
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {/* Workspace Label */}
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <FiShield className="w-3.5 h-3.5" />
                <span>Workspace</span>
              </div>
            )}

            <div className="space-y-1">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isOnItemPage = pathname.startsWith(item.href.split('?')[0]);
                const isLoading = loadingPath === item.href;
                const isActive = item.subItems ? false : pathname === item.href;
                const isParentActive = item.subItems && isOnItemPage;

                return (
                  <div key={item.href}>
                    <button
                      onClick={() => handleNavigation(item.href)}
                      disabled={isLoading || !!loadingPath}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : isParentActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
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
                        <span className="font-medium text-sm">{item.label}</span>
                      )}
                    </button>

                    {/* Sub-items for Employee Dashboard */}
                    {item.subItems && !isCollapsed && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
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
                              onClick={() => handleNavigation(subItem.href)}
                              disabled={isSubLoading || !!loadingPath}
                              className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm',
                                isSubActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
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
              <div className="mt-6 pt-6 border-t border-sidebar-border">
                {!isCollapsed && (
                  <div className="flex items-center gap-2 px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <FiShield className="w-3.5 h-3.5" />
                    <span>Super Admin</span>
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
                        disabled={isLoading || !!loadingPath}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-soft'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
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
                          <span className="font-medium text-sm">{item.label}</span>
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
