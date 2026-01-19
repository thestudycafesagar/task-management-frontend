'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import { CardSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCheckSquare, FiClock, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';

export default function DashboardPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Fetch task stats - Real-time updates via Socket.IO
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['task-stats', params.slug],
    queryFn: async () => {
      const response = await apiClient.get('/tasks/stats');
      return response.data.data.stats;
    },
    staleTime: 60000, // Data stays fresh for 60 seconds
  });

  // Fetch recent tasks - Real-time updates via Socket.IO
  const { data: tasksData, isLoading: tasksLoading, refetch } = useQuery({
    queryKey: ['recent-tasks', params.slug],
    queryFn: async () => {
      const response = await apiClient.get('/tasks?limit=6');
      return response.data.data.tasks;
    },
    staleTime: 60000, // Data stays fresh for 60 seconds
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
      color: 'bg-blue-500',
    },
    {
      label: 'In Progress',
      value: statsData?.inProgress || 0,
      icon: FiClock,
      color: 'bg-yellow-500',
    },
    {
      label: 'Completed',
      value: statsData?.completed || 0,
      icon: FiCheckSquare,
      color: 'bg-green-500',
    },
    {
      label: 'Overdue',
      value: statsData?.overdue || 0,
      icon: FiAlertCircle,
      color: 'bg-red-500',
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
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
          <a href={`/${params.slug}/tasks`} className="text-sm text-primary hover:underline">
            View All
          </a>
        </div>

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
      </div>

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
