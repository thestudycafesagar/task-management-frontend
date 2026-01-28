'use client';

import * as React from 'react';
import Sidebar, { SidebarProvider, useSidebar } from './Sidebar';
import TopNavbar from './TopNavbar';
import GlobalLoader from './GlobalLoader';
import useSocketNotifications from '@/hooks/useSocketNotifications';
import useLoaderStore from '@/store/loaderStore';
import { cn } from '@/lib/utils';

/**
 * Main content wrapper that responds to sidebar state
 */
function MainContent({ children }) {
  const { isCollapsed } = useSidebar();
  const ref = React.useRef(null);

  // Mouse glow effect
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced) return;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      el.style.setProperty('--glow-x', `${x}px`);
      el.style.setProperty('--glow-y', `${y}px`);
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div ref={ref} className="app-container pointer-glow relative">
      {/* Signature gradient overlay for glow effect */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(480px 300px at var(--glow-x, 20%) var(--glow-y, 10%), hsl(var(--primary) / 0.08), transparent 60%)',
        }}
      />

      <div className="relative flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content - dynamically responds to sidebar width */}
        <div className={cn(
          'flex min-h-screen flex-1 flex-col transition-all duration-300',
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}>
          {/* Top navbar */}
          <TopNavbar />

          {/* Page content */}
          <main className="flex-1 px-4 py-6 md:px-6">
            <div className="mx-auto w-full max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * App layout component with modern sidebar and top navbar
 */
export default function AppLayout({ children }) {
  // Initialize Socket.IO for real-time notifications
  useSocketNotifications();
  
  const { isGlobalLoading, loadingMessage } = useLoaderStore();

  return (
    <SidebarProvider>
      {isGlobalLoading && <GlobalLoader message={loadingMessage} />}
      <MainContent>{children}</MainContent>
    </SidebarProvider>
  );
}
