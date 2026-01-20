'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { FiFolder, FiPlus } from 'react-icons/fi';
import { Label } from '@/components/ui/label';
import BucketCreateModal from '@/components/bucket/BucketCreateModal';
import { Button } from '@/components/ui/button';

/**
 * TaskBucketSelect - Bucket selector for task creation/editing
 */
export default function TaskBucketSelect({ value, onChange, disabled = false }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch buckets
  const { data: bucketsData, isLoading } = useQuery({
    queryKey: ['buckets'],
    queryFn: async () => {
      const response = await apiClient.get('/buckets');
      return response.data.data.buckets;
    }
  });

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="bucket">Bucket (Optional)</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-auto py-1 px-2 text-xs"
        >
          <FiPlus className="w-3 h-3 mr-1" />
          New Bucket
        </Button>
      </div>

      <div className="relative group">
        <FiFolder className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
        <select
          id="bucket"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled || isLoading}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">No bucket</option>
          {bucketsData?.map((bucket) => (
            <option key={bucket._id} value={bucket._id}>
              {bucket.name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        Organize tasks into categories
      </p>

      {/* Create Modal */}
      <BucketCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateSuccess}
      />
    </div>
  );
}
