'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
import { FiCheckSquare, FiClock, FiAlertCircle, FiTrendingUp, FiActivity, FiList } from 'react-icons/fi';
import { cn, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, hasAdminPrivileges } = useAuthStore();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Get active tab from URL, default to 'overview'
  const activeTab = searchParams.get('tab') || 'overview';

  // Check if user is employee (not admin)
  const isEmployee = !hasAdminPrivileges && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN';

  // Debug logging
  useEffect(() => {
    console.log('🎯 Dashboard Debug:', {
      userRole: user?.role,
      isEmployee,
      hasAdminPrivileges,
      activeTab,
    });
  }, [user?.role, isEmployee, hasAdminPrivileges, activeTab]);

  // Fetch task stats - Real-time updates via Socket.IO
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['task-stats', params.slug],
    queryFn: async () => {
      const response = await apiClient.get('/tasks/stats');
      return response.data.data.stats;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch recent tasks - Real-time updates via Socket.IO
  const { data: tasksData, isLoading: tasksLoading, refetch } = useQuery({
    queryKey: ['recent-tasks', params.slug],
    queryFn: async () => {
      const response = await apiClient.get('/tasks?limit=6');
      return response.data.data.tasks;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch all tasks for employee (for My Tasks tab)
  const { data: allTasksData, isLoading: allTasksLoading } = useQuery({
    queryKey: ['all-tasks', params.slug],
    queryFn: async () => {
      const response = await apiClient.get('/tasks');
      return response.data.data.tasks;
    },
    enabled: isEmployee, // Only fetch for employees
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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

  // Group tasks by status for Activity tab
  const groupedTasks = allTasksData?.reduce((acc, task) => {
    const status = task.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {}) || {};

  return (
    <AppLayout>
      <PageHeader
        title={`Welcome back, ${user?.name}!`}
        description="Here's an overview of your tasks"
      />

      {/* Overview Tab (Default for Admin, Tab for Employee) */}
      {(!isEmployee || activeTab === 'overview') && (
        <>
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
        </>
      )}

      {/* My Tasks Tab - All tasks for employee */}
      {isEmployee && activeTab === 'my-tasks' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">All My Tasks</h2>
            <span className="text-sm text-gray-500">
              {allTasksData?.length || 0} tasks total
            </span>
          </div>

          {allTasksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : allTasksData && allTasksData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTasksData.map((task) => (
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
              title="No tasks assigned"
              description="You don't have any tasks assigned yet"
            />
          )}
        </div>
      )}

      {/* Activity Tab - Grouped by status */}
      {isEmployee && activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Pending Tasks */}
          {groupedTasks.PENDING && groupedTasks.PENDING.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Pending Tasks ({groupedTasks.PENDING.length})
                </h3>
              </div>
              <div className="space-y-3">
                {groupedTasks.PENDING.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-gray-500 ml-4">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In Progress Tasks */}
          {groupedTasks.IN_PROGRESS && groupedTasks.IN_PROGRESS.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  In Progress ({groupedTasks.IN_PROGRESS.length})
                </h3>
              </div>
              <div className="space-y-3">
                {groupedTasks.IN_PROGRESS.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-gray-500 ml-4">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {groupedTasks.COMPLETED && groupedTasks.COMPLETED.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Completed ({groupedTasks.COMPLETED.length})
                </h3>
              </div>
              <div className="space-y-3">
                {groupedTasks.COMPLETED.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-shadow opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 line-through">{task.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      </div>
                      {task.completedAt && (
                        <span className="text-xs text-gray-500 ml-4">
                          Completed: {formatDate(task.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Tasks */}
          {groupedTasks.OVERDUE && groupedTasks.OVERDUE.length > 0 && (
            <div className="bg-white rounded-lg border border-red-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold text-red-600">
                  Overdue Tasks ({groupedTasks.OVERDUE.length})
                </h3>
              </div>
              <div className="space-y-3">
                {groupedTasks.OVERDUE.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 border border-red-200 rounded-lg hover:shadow-md cursor-pointer transition-shadow bg-red-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-red-600 font-semibold ml-4">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for activity */}
          {Object.keys(groupedTasks).length === 0 && !allTasksLoading && (
            <EmptyState
              icon={FiActivity}
              title="No activity yet"
              description="Your task activity will appear here once you have tasks assigned"
            />
          )}
        </div>
      )}

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
