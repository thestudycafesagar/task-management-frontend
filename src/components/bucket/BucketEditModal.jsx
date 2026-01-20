'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { FiX, FiFolder } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ButtonLoader from '@/components/ButtonLoader';

/**
 * BucketEditModal - Modal for editing existing buckets
 */
export default function BucketEditModal({ isOpen, onClose, bucket }) {
  const queryClient = useQueryClient();
  const [bucketName, setBucketName] = useState('');

  useEffect(() => {
    if (bucket) {
      setBucketName(bucket.name);
    }
  }, [bucket]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.patch(`/buckets/${bucket._id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Bucket updated successfully!');
      queryClient.invalidateQueries(['buckets']);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update bucket');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bucketName.trim()) {
      toast.error('Bucket name is required');
      return;
    }
    updateMutation.mutate({ name: bucketName.trim() });
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      setBucketName('');
      onClose();
    }
  };

  if (!isOpen || !bucket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={handleClose} 
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-float border border-border max-w-md w-full animate-fadeIn">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FiFolder className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Edit Bucket</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={updateMutation.isPending}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-accent rounded-lg disabled:opacity-50"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="bucketName">Bucket Name</Label>
            <Input
              id="bucketName"
              type="text"
              placeholder="e.g., Company Tasks, Accounting, HR"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              disabled={updateMutation.isPending}
              className="mt-1.5"
              maxLength={100}
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || !bucketName.trim()}
              className="flex-1"
            >
              {updateMutation.isPending ? <ButtonLoader /> : 'Update Bucket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
