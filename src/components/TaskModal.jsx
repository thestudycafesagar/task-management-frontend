'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiUser, FiDownload, FiUpload, FiAlertCircle } from 'react-icons/fi';
import { cn, getPriorityColor, getStatusColor, formatDateTime, downloadFile } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import ButtonLoader from './ButtonLoader';
import ConfirmDialog from './ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TaskBucketBadge from './task/TaskBucketBadge';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import useAuthStore from '@/store/authStore';

/**
 * Task modal component for viewing and editing tasks
 */
export default function TaskModal({ task, isOpen, onClose, onUpdate }) {
  const { user, hasAdminPrivileges } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(task?.myStatus || task?.status);
  const [uploading, setUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  // Update selected status when task changes - use myStatus for employees, status for admins
  useEffect(() => {
    setSelectedStatus(task?.myStatus || task?.status);
  }, [task?.myStatus, task?.status]);

  if (!isOpen || !task) return null;

  const handleStatusChange = async (newStatus) => {
    // Show confirmation dialog
    setPendingStatus(newStatus);
    setShowConfirmDialog(true);
  };

  const confirmStatusChange = async () => {
    try {
      setIsLoading(true);
      setShowConfirmDialog(false);
      
      const response = await apiClient.patch(`/tasks/${task._id}`, {
        status: pendingStatus,
      });
      
      setSelectedStatus(pendingStatus);
      onUpdate(response.data.data.task);
      toast.success('Task status updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task status');
      // Revert to previous status on error
      setSelectedStatus(task?.myStatus || task?.status);
    } finally {
      setIsLoading(false);
      setPendingStatus(null);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(
        `/tasks/${task._id}/attachments`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      onUpdate(response.data.data.task);
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadCalendar = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/tasks/${task._id}/calendar.ics`;
    downloadFile(url, `task-${task._id}.ics`);
    toast.success('Calendar file downloaded');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-float border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-start justify-between z-10">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{task.title}</h2>
            <div className="flex gap-2 mt-2">
              <Badge variant={
                task.priority === 'HIGH' ? 'danger' : 
                task.priority === 'MEDIUM' ? 'warning' : 'success'
              }>
                {task.priority}
              </Badge>
              <Badge variant={
                selectedStatus === 'COMPLETED' ? 'success' : 
                selectedStatus === 'OVERDUE' ? 'danger' : 
                selectedStatus === 'IN_PROGRESS' ? 'default' : 'secondary'
              }>
                {selectedStatus?.replace('_', ' ')}
              </Badge>
              <TaskBucketBadge bucket={task.bucketId} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-accent rounded-lg"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
            <p className="text-muted-foreground">{task.description || 'No description provided'}</p>
          </div>

          {/* Status Selector */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Update Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isLoading}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                    selectedStatus === status
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background hover:bg-accent text-foreground'
                  )}
                >
                  {isLoading && pendingStatus === status ? (
                    <ButtonLoader />
                  ) : (
                    status.replace('_', ' ')
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Assigned To</h3>
            <div className="space-y-2">
              {Array.isArray(task.assignedTo) ? (
                task.assignedTo.map((user) => {
                  // Find employee's individual status if available (for admin view)
                  const employeeStatus = task.employeeStatus?.find(
                    es => es.employeeId === user._id
                  );
                  
                  return (
                    <div key={user._id} className="flex items-center gap-3 p-3 bg-accent/50 rounded-xl">
                      <UserAvatar user={user} />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      {employeeStatus && hasAdminPrivileges && (
                        <Badge variant={
                          employeeStatus.status === 'COMPLETED' ? 'success' : 
                          employeeStatus.status === 'IN_PROGRESS' ? 'default' : 'secondary'
                        } className="text-xs">
                          {employeeStatus.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-xl">
                  <UserAvatar user={task.assignedTo} />
                  <div>
                    <p className="font-medium text-foreground">{task.assignedTo?.name}</p>
                    <p className="text-sm text-muted-foreground">{task.assignedTo?.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Created By / Task Assigned By */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Task Assigned By</h3>
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <UserAvatar user={task.createdBy} />
              <div className="flex-1">
                <p className="font-medium text-foreground">{task.createdBy?.name}</p>
                <p className="text-sm text-muted-foreground">{task.createdBy?.email}</p>
                <p className="text-xs text-primary font-medium mt-1">
                  {task.createdBy?.role === 'ADMIN' ? 'Administrator' : task.createdBy?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Due Date</h3>
              <div className="flex items-center gap-2 text-foreground">
                <FiCalendar className="w-5 h-5 text-muted-foreground" />
                <span>{formatDateTime(task.dueDate)}</span>
              </div>
              <button
                onClick={handleDownloadCalendar}
                className="mt-2 text-sm text-primary hover:underline flex items-center gap-1"
              >
                <FiDownload className="w-4 h-4" />
                Add to Calendar
              </button>
            </div>
          )}

          {/* Attachments */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Attachments</h3>
            {task.attachments?.length > 0 ? (
              <div className="space-y-2">
                {task.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                      <FiDownload className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-foreground">{attachment.fileName}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No attachments</p>
            )}

            {/* Upload button */}
            <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors cursor-pointer">
              <FiUpload className="w-4 h-4" />
              <span className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Upload File'}
              </span>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-border text-sm text-muted-foreground">
            <p>Created by: {task.createdBy?.name}</p>
            <p>Created: {formatDateTime(task.createdAt)}</p>
            {task.completedAt && (
              <p>Completed: {formatDateTime(task.completedAt)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setPendingStatus(null);
        }}
        onConfirm={confirmStatusChange}
        title="Update Task Status"
        message={`Are you sure you want to change the status to "${pendingStatus?.replace('_', ' ')}"?`}
        confirmText="Yes, Update"
        cancelText="Cancel"
        variant="primary"
        isLoading={isLoading}
      />
    </div>
  );
}
