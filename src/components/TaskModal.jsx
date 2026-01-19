'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiUser, FiDownload, FiUpload, FiAlertCircle } from 'react-icons/fi';
import { cn, getPriorityColor, getStatusColor, formatDateTime, downloadFile } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import ButtonLoader from './ButtonLoader';
import ConfirmDialog from './ConfirmDialog';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';

/**
 * Task modal component for viewing and editing tasks
 */
export default function TaskModal({ task, isOpen, onClose, onUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(task?.status);
  const [uploading, setUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  // Update selected status when task changes
  useEffect(() => {
    setSelectedStatus(task?.status);
  }, [task?.status]);

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
      setSelectedStatus(task?.status);
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
            <div className="flex gap-2 mt-2">
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full border',
                  getPriorityColor(task.priority)
                )}
              >
                {task.priority}
              </span>
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full border',
                  getStatusColor(selectedStatus)
                )}
              >
                {selectedStatus?.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{task.description || 'No description provided'}</p>
          </div>

          {/* Status Selector */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Update Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isLoading}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50',
                    selectedStatus === status
                      ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
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
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Assigned To</h3>
            <div className="space-y-2">
              {Array.isArray(task.assignedTo) ? (
                task.assignedTo.map((user) => (
                  <div key={user._id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <UserAvatar user={user} />
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <UserAvatar user={task.assignedTo} />
                  <div>
                    <p className="font-medium text-gray-900">{task.assignedTo?.name}</p>
                    <p className="text-sm text-gray-500">{task.assignedTo?.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Created By / Task Assigned By */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Task Assigned By</h3>
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <UserAvatar user={task.createdBy} />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{task.createdBy?.name}</p>
                <p className="text-sm text-gray-500">{task.createdBy?.email}</p>
                <p className="text-xs text-blue-600 font-medium mt-1">
                  {task.createdBy?.role === 'ADMIN' ? 'Administrator' : task.createdBy?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Due Date</h3>
              <div className="flex items-center gap-2 text-gray-700">
                <FiCalendar className="w-5 h-5" />
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
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Attachments</h3>
            {task.attachments?.length > 0 ? (
              <div className="space-y-2">
                {task.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <FiDownload className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-700">{attachment.fileName}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No attachments</p>
            )}

            {/* Upload button */}
            <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
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
          <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
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
