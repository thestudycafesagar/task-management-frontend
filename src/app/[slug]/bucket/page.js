'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { FiFolder, FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import BucketCreateModal from '@/components/bucket/BucketCreateModal';
import BucketEditModal from '@/components/bucket/BucketEditModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { TableSkeleton, CardSkeleton } from '@/components/SkeletonLoader';
import { formatDateTime } from '@/lib/utils';

export default function BucketPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState(null);
  const [deletingBucket, setDeletingBucket] = useState(null);

  // Fetch buckets
  const { data: bucketsData, isLoading } = useQuery({
    queryKey: ['buckets', params.slug, searchQuery],
    queryFn: async () => {
      const params = searchQuery ? `?search=${searchQuery}` : '';
      const response = await apiClient.get(`/buckets${params}`);
      return response.data.data.buckets;
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (bucketId) => {
      await apiClient.delete(`/buckets/${bucketId}`);
    },
    onSuccess: () => {
      toast.success('Bucket deleted successfully');
      queryClient.invalidateQueries(['buckets']);
      setDeletingBucket(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete bucket');
    }
  });

  const handleDelete = () => {
    if (deletingBucket) {
      deleteMutation.mutate(deletingBucket._id);
    }
  };

  const handleEdit = (bucket) => {
    setEditingBucket(bucket);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Buckets"
        description="Organize your tasks into categories"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <FiPlus className="w-5 h-5 mr-2" />
            Create Bucket
          </Button>
        }
      />

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search buckets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Buckets Table - Desktop */}
      <Card className="hidden md:block">
        {isLoading ? (
          <CardContent className="p-6">
            <TableSkeleton rows={5} />
          </CardContent>
        ) : bucketsData && bucketsData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bucketsData.map((bucket) => (
                <TableRow key={bucket._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FiFolder className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">
                        {bucket.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {bucket.createdBy?.name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(bucket.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(bucket)}
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingBucket(bucket)}
                        className="text-destructive hover:text-destructive"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CardContent className="p-12">
            <EmptyState
              icon={FiFolder}
              title="No buckets found"
              description={searchQuery ? "No buckets match your search" : "Create your first bucket to organize tasks"}
              action={
                !searchQuery && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <FiPlus className="w-4 h-4 mr-2" />
                    Create Bucket
                  </Button>
                )
              }
            />
          </CardContent>
        )}
      </Card>

      {/* Buckets Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </>
        ) : bucketsData && bucketsData.length > 0 ? (
          bucketsData.map((bucket) => (
            <Card key={bucket._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FiFolder className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {bucket.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {bucket.createdBy?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  Created {formatDateTime(bucket.createdAt)}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(bucket)}
                  >
                    <FiEdit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDeletingBucket(bucket)}
                  >
                    <FiTrash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12">
              <EmptyState
                icon={FiFolder}
                title="No buckets found"
                description={searchQuery ? "No buckets match your search" : "Create your first bucket to organize tasks"}
                action={
                  !searchQuery && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <FiPlus className="w-4 h-4 mr-2" />
                      Create Bucket
                    </Button>
                  )
                }
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <BucketCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal */}
      <BucketEditModal
        isOpen={!!editingBucket}
        onClose={() => setEditingBucket(null)}
        bucket={editingBucket}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingBucket}
        onClose={() => setDeletingBucket(null)}
        onConfirm={handleDelete}
        title="Delete Bucket"
        message={`Are you sure you want to delete "${deletingBucket?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </AppLayout>
  );
}


