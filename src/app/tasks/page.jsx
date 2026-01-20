'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import CreateTaskModal from '@/components/CreateTaskModal';
import { CardSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/api';
import { FiCheckSquare, FiFilter, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TasksPage() {
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

  // Fetch tasks
  const { data: tasksData, isLoading, refetch } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      
      const response = await apiClient.get(`/tasks?${params.toString()}`);
      return response.data.data.tasks;
    },
  });

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdate = (updatedTask) => {
    refetch();
    toast.success('Task updated successfully');
  };

  const handleTaskCreated = () => {
    refetch();
  };

  return (
    <AppLayout>
      <PageHeader
        title="Tasks"
        description="Manage and track all your tasks"
        action={
          isAdmin && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Create Task
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <FiFilter className="w-5 h-5 text-muted-foreground" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            >
              <option value="">All Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tasksData && tasksData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      {isAdmin && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            handleTaskCreated();
          }}
        />
      )}
    </AppLayout>
  );
}
