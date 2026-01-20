'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import CreateTaskModal from '@/components/CreateTaskModal';
import { CardSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/api';
import { FiCheckSquare, FiFilter, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const params = useParams();
  const { user, isImpersonating, hasAdminPrivileges } = useAuthStore();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
  });

  // Check if user has admin privileges (using backend flag)
  const isAdmin = hasAdminPrivileges || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Fetch tasks - Real-time updates via Socket.IO
  const { data: tasksData, isLoading, refetch } = useQuery({
    queryKey: ['tasks', params.slug, filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      
      const response = await apiClient.get(`/tasks?${queryParams.toString()}`);
      return response.data.data.tasks;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdate = (updatedTask) => {
    // Update the selected task to reflect changes in the modal
    setSelectedTask(updatedTask);
    // Refetch to update the list
    refetch();
  };

  return (
    <AppLayout>
      <PageHeader
        title="Tasks"
        description="Manage and track all your tasks"
        action={
          isAdmin && (
            <Button onClick={() => setShowCreateModal(true)}>
              <FiPlus className="w-5 h-5 mr-2" />
              Create Task
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <FiFilter className="w-5 h-5 text-muted-foreground hidden sm:block" />
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium text-foreground block sm:hidden mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full sm:w-auto px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium text-foreground block sm:hidden mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full sm:w-auto px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="">All Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tasks Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tasksData && tasksData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {tasksData.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={() => handleTaskClick(task)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FiCheckSquare}
          title="No tasks found"
          description="Try adjusting your filters or create a new task"
        />
      )}

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onUpdate={handleTaskUpdate}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </AppLayout>
  );
}
