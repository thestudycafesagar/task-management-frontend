'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import BucketItem from './BucketItem';
import BucketCreateModal from './BucketCreateModal';
import BucketSearch from './BucketSearch';
import { FiPlus, FiFolder } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/EmptyState';

/**
 * BucketList - Displays all buckets for the organization
 * Used in sidebar and bucket management pages
 */
export default function BucketList({ 
  isCollapsed = false, 
  onBucketSelect = null,
  selectedBucketId = null,
  showCreateButton = true,
  maxHeight = 'auto'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch buckets
  const { data: bucketsData, isLoading } = useQuery({
    queryKey: ['buckets', searchQuery],
    queryFn: async () => {
      const params = searchQuery ? `?search=${searchQuery}` : '';
      const response = await apiClient.get(`/buckets${params}`);
      return response.data.data.buckets;
    }
  });

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      {showCreateButton && (
        <div className="flex items-center justify-between px-3 mb-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <FiFolder className="w-3.5 h-3.5" />
            <span>Buckets</span>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
            title="Create new bucket"
          >
            <FiPlus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <BucketSearch 
        value={searchQuery} 
        onChange={setSearchQuery} 
      />

      {/* Bucket List */}
      <div 
        className="space-y-1" 
        style={{ maxHeight, overflowY: 'auto' }}
      >
        {isLoading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Loading buckets...
          </div>
        ) : bucketsData && bucketsData.length > 0 ? (
          bucketsData.map((bucket) => (
            <BucketItem
              key={bucket._id}
              bucket={bucket}
              isSelected={selectedBucketId === bucket._id}
              onClick={() => onBucketSelect && onBucketSelect(bucket)}
            />
          ))
        ) : (
          <div className="px-3 py-6">
            <EmptyState
              icon={FiFolder}
              title="No buckets"
              description={searchQuery ? "No buckets match your search" : "Create your first bucket to organize tasks"}
            />
          </div>
        )}
      </div>

      {/* Create Modal */}
      <BucketCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
