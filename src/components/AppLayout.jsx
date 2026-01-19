'use client';

import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import useSocketNotifications from '@/hooks/useSocketNotifications';

/**
 * App layout component with sidebar and top navbar
 */
export default function AppLayout({ children }) {
  // Initialize Socket.IO for real-time notifications
  useSocketNotifications();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top navbar */}
        <TopNavbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
