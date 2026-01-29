/**
 * useBuckets Hook
 * Handles bucket-related business logic and state management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { bucketService } from '@/services';
import toast from 'react-hot-toast';

export const useBuckets = () => {
  const params = useParams();
  const queryClient = useQueryClient();

  // Fetch buckets
  const {
    data: buckets,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['buckets', params?.slug],
    queryFn: bucketService.getBuckets,
    staleTime: 30000,
  });

  // Create bucket mutation
  const createBucketMutation = useMutation({
    mutationFn: bucketService.createBucket,
    onSuccess: () => {
      toast.success('✅ Bucket created successfully!');
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create bucket');
    },
  });

  // Update bucket mutation
  const updateBucketMutation = useMutation({
    mutationFn: ({ bucketId, updates }) => bucketService.updateBucket(bucketId, updates),
    onSuccess: () => {
      toast.success('✅ Bucket updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update bucket');
    },
  });

  // Delete bucket mutation
  const deleteBucketMutation = useMutation({
    mutationFn: bucketService.deleteBucket,
    onSuccess: () => {
      toast.success('✅ Bucket deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete bucket');
    },
  });

  return {
    // Data
    buckets,
    
    // Loading states
    isLoading,
    
    // Actions
    createBucket: createBucketMutation.mutate,
    updateBucket: updateBucketMutation.mutate,
    deleteBucket: deleteBucketMutation.mutate,
    refetch,
    
    // Mutation states
    isCreating: createBucketMutation.isPending,
    isUpdating: updateBucketMutation.isPending,
    isDeleting: deleteBucketMutation.isPending,
  };
};
