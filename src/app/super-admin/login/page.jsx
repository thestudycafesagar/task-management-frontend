'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ButtonLoader from '@/components/ButtonLoader';
import toast from 'react-hot-toast';
import { FiShield, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { setUser, setOrganization } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Clear any invalid cookies on mount
  useEffect(() => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.post('/auth/super-admin/login', formData);
      
      // Update auth store
      setUser(response.data.data.user);
      setOrganization(null);
      
      toast.success('🎉 Welcome Super Admin!');
      router.push('/super-admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid super admin credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary px-4 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl mb-4 shadow-float transform hover:scale-110 transition-transform duration-300">
            <FiShield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Super Admin
          </h1>
          <p className="text-white/80 text-lg">Platform Management Portal 🔐</p>
        </div>

        {/* Form */}
        <div className="bg-card/10 backdrop-blur-lg rounded-3xl shadow-float p-8 border border-white/20 animate-slideIn">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-white">Email Address</Label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white/80 transition-colors" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-12 bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-white/30 focus:border-white/40"
                  placeholder="superadmin@platform.com"
                  autoFocus
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Password</Label>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white/80 transition-colors" />
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-12 bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-white/30 focus:border-white/40"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-primary hover:bg-white/90 shadow-card py-6 text-lg font-semibold group"
            >
              {isLoading ? (
                <ButtonLoader />
              ) : (
                <>
                  Sign In as Super Admin
                  <FiArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white/70 font-medium">Company Portal</span>
            </div>
          </div>

          {/* Regular Login Link */}
          <Link
            href="/login"
            className="block w-full text-center py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all transform hover:scale-[1.02]"
          >
            Company Login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-white/70 mt-6 animate-fadeIn">
          This is a restricted area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
