/**
 * useTasks Hook
 * Handles task-related business logic and state management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { taskService } from '@/services';
import toast from 'react-hot-toast';

export const useTasks = (filters = {}) => {
  const params = useParams();
  const queryClient = useQueryClient();

  // Fetch tasks with filters
  const {
    data: tasks,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks', params?.slug, filters],
    queryFn: () => taskService.getTasks(filters),
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch task stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['task-stats', params?.slug],
    queryFn: taskService.getTaskStats,
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Fetch task analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', params?.slug],
    queryFn: taskService.getTaskAnalytics,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      toast.success('✅ Task created successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }) => taskService.updateTask(taskId, updates),
    onSuccess: () => {
      toast.success('✅ Task updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      toast.success('✅ Task deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    },
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => taskService.updateTaskStatus(taskId, status),
    onSuccess: () => {
      toast.success('✅ Status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Upload attachment mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ taskId, file }) => taskService.uploadAttachment(taskId, file),
    onSuccess: () => {
      toast.success('✅ Attachment uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload attachment');
    },
  });

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ taskId, attachmentId }) =>
      taskService.deleteAttachment(taskId, attachmentId),
    onSuccess: () => {
      toast.success('✅ Attachment deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete attachment');
    },
  });

  return {
    // Data
    tasks,
    stats,
    analytics,
    
    // Loading states
    isLoading,
    statsLoading,
    analyticsLoading,
    
    // Actions
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    uploadAttachment: uploadAttachmentMutation.mutate,
    deleteAttachment: deleteAttachmentMutation.mutate,
    refetch,
    
    // Mutation states
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isUploadingAttachment: uploadAttachmentMutation.isPending,
  };
};
