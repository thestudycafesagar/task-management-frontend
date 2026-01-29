/**
 * useEmployees Hook
 * Handles employee-related business logic and state management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { userService } from '@/services';
import toast from 'react-hot-toast';

export const useEmployees = () => {
  const params = useParams();
  const queryClient = useQueryClient();

  // Fetch employees
  const {
    data: employees,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employees', params?.slug],
    queryFn: userService.getEmployees,
    staleTime: 30000,
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: userService.createEmployee,
    onSuccess: () => {
      toast.success('✅ Employee created successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create employee');
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: ({ userId, updates }) => userService.updateEmployee(userId, updates),
    onSuccess: () => {
      toast.success('✅ Employee updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: userService.deleteEmployee,
    onSuccess: () => {
      toast.success('✅ Employee deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    },
  });

  // Toggle employee status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: userService.toggleEmployeeStatus,
    onSuccess: () => {
      toast.success('✅ Employee status updated!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Force change password mutation
  const forceChangePasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }) =>
      userService.forceChangePassword(userId, newPassword),
    onSuccess: () => {
      toast.success('✅ Password changed successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  return {
    // Data
    employees,
    
    // Loading states
    isLoading,
    
    // Actions
    createEmployee: createEmployeeMutation.mutate,
    updateEmployee: updateEmployeeMutation.mutate,
    deleteEmployee: deleteEmployeeMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    forceChangePassword: forceChangePasswordMutation.mutate,
    refetch,
    
    // Mutation states
    isCreating: createEmployeeMutation.isPending,
    isUpdating: updateEmployeeMutation.isPending,
    isDeleting: deleteEmployeeMutation.isPending,
  };
};
