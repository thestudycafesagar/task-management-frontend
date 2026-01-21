'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { FiX, FiFolder, FiSearch } from 'react-icons/fi';
import { Input } from '@/components/ui/input';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import EmptyState from '@/components/EmptyState';
import { CardSkeleton } from '@/components/SkeletonLoader';

/**
 * BucketDetailModal - Shows all tasks in a specific bucket
 */
export default function BucketDetailModal({ isOpen, onClose, bucket }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState([]);

  // Fetch tasks for this bucket
  const { data: tasksData, isLoading, refetch } = useQuery({
    queryKey: ['bucket-tasks', bucket?._id],
    queryFn: async () => {
      const response = await apiClient.get(`/tasks`);
      // Filter tasks by bucketId on frontend
      const allTasks = response.data.data.tasks;
      return allTasks.filter(task => task.bucketId?._id === bucket._id);
    },
    enabled: isOpen && !!bucket
  });

  // Filter tasks based on search query
  useEffect(() => {
    if (!tasksData) {
      setFilteredTasks([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredTasks(tasksData);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tasksData.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.status?.toLowerCase().includes(query) ||
      task.priority?.toLowerCase().includes(query)
    );
    setFilteredTasks(filtered);
  }, [tasksData, searchQuery]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdate = (updatedTask) => {
    setSelectedTask(updatedTask);
    refetch();
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  if (!isOpen || !bucket) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop with blur */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />

        {/* Modal */}
        <div className="relative bg-card rounded-2xl shadow-float border border-border max-w-4xl w-full max-h-[85vh] overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FiFolder className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{bucket.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredTasks.length !== tasksData?.length 
                      ? `${filteredTasks.length} of ${tasksData?.length} task${tasksData?.length !== 1 ? 's' : ''}`
                      : `${tasksData?.length || 0} task${tasksData?.length !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-accent rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tasks by title, description, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-160px)]">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : filteredTasks && filteredTasks.length > 0 ? (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </div>
            ) : searchQuery ? (
              <div className="py-12">
                <EmptyState
                  icon={FiSearch}
                  title="No tasks found"
                  description={`No tasks match "${searchQuery}"`}
                />
              </div>
            ) : (
              <div className="py-12">
                <EmptyState
                  icon={FiFolder}
                  title="No tasks in this bucket"
                  description="Tasks assigned to this bucket will appear here"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={showTaskModal}
          onClose={handleCloseTaskModal}
          onUpdate={handleTaskUpdate}
        />
      )}
    </>
  );
}
