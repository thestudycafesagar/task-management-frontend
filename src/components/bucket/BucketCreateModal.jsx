'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { FiX, FiFolder } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ButtonLoader from '@/components/ButtonLoader';

/**
 * BucketCreateModal - Modal for creating new buckets
 */
export default function BucketCreateModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [bucketName, setBucketName] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/buckets', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Bucket created successfully!');
      queryClient.invalidateQueries(['buckets']);
      setBucketName('');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create bucket');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bucketName.trim()) {
      toast.error('Bucket name is required');
      return;
    }
    createMutation.mutate({ name: bucketName.trim() });
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      setBucketName('');
      onClose();
    }
  };

  if (!isOpen) return null;

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
            <h2 className="text-xl font-bold text-foreground">Create Bucket</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
              className="mt-1.5"
              maxLength={100}
              autoFocus
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Create categories to organize your tasks
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !bucketName.trim()}
              className="flex-1"
            >
              {createMutation.isPending ? <ButtonLoader /> : 'Create Bucket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
