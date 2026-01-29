/**
 * useAuth Hook
 * Handles authentication business logic
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setOrganization, logout: clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setUser(data.data.user);
      setOrganization(data.data.organization);
      toast.success('✅ Login successful!');
      router.push(data.data.redirectTo);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  const signupMutation = useMutation({
    mutationFn: authService.companySignup,
    onSuccess: (data) => {
      setUser(data.data.user);
      setOrganization(data.data.organization);
      toast.success('✅ Company registered successfully!');
      router.push(data.data.redirectTo);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Signup failed');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success('✅ Logged out successfully');
      router.push('/login');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Logout failed');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      toast.success('✅ Password changed successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  return {
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
};
