'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import { CardSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCheckSquare, FiClock, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Fetch task stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['task-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/tasks/stats');
      return response.data.data.stats;
    },
  });

  // Fetch recent tasks
  const { data: tasksData, isLoading: tasksLoading, refetch } = useQuery({
    queryKey: ['recent-tasks'],
    queryFn: async () => {
      const response = await apiClient.get('/tasks?limit=6');
      return response.data.data.tasks;
    },
  });

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdate = (updatedTask) => {
    refetch();
  };

  const stats = [
    {
      label: 'Total Tasks',
      value: statsData?.total || 0,
      icon: FiCheckSquare,
      color: 'bg-primary',
    },
    {
      label: 'In Progress',
      value: statsData?.inProgress || 0,
      icon: FiClock,
      color: 'bg-warning',
    },
    {
      label: 'Completed',
      value: statsData?.completed || 0,
      icon: FiCheckSquare,
      color: 'bg-success',
    },
    {
      label: 'Overdue',
      value: statsData?.overdue || 0,
      icon: FiAlertCircle,
      color: 'bg-destructive',
    },
  ];

  return (
    <AppLayout>
      <PageHeader
        title={`Welcome back, ${user?.name}!`}
        description="Here's an overview of your tasks"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-card transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent Tasks</CardTitle>
          <a href="/tasks" className="text-sm text-primary hover:underline font-medium">
            View All
          </a>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
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
              title="No tasks yet"
              description="Tasks will appear here once they are created"
            />
          )}
        </CardContent>
      </Card>

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onUpdate={handleTaskUpdate}
      />
    </AppLayout>
  );
}
