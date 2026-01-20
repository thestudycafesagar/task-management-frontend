'use client';

import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { FiShield, FiLogOut } from 'react-icons/fi';

export default function SuperAdminNavbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <nav className="gradient-primary border-b border-primary/20 shadow-card">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl">
              <FiShield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Super Admin Portal</h1>
              <p className="text-xs text-white/70">Platform Management</p>
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-white/70">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-white hover:bg-white/20 border border-white/20"
            >
              <FiLogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
