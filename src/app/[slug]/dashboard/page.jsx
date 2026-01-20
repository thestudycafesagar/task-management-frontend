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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      color: 'bg-danger',
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-card to-card/80">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">{stat.label}</p>
                        <p className="text-2xl sm:text-3xl font-bold text-foreground">
                          {statsLoading ? (
                            <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded"></span>
                          ) : (
                            stat.value
                          )}
                        </p>
                      </div>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Tasks */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Recent Tasks</CardTitle>
              <a href={`/${params.slug}/tasks`} className="text-xs sm:text-sm text-primary hover:underline font-medium">
                View All
              </a>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
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
        </>
      )}

      {/* My Tasks Tab - All tasks for employee */}
      {isEmployee && activeTab === 'my-tasks' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All My Tasks</CardTitle>
            <span className="text-sm text-muted-foreground">
              {allTasksData?.length || 0} tasks total
            </span>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Activity Tab - Grouped by status */}
      {isEmployee && activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Pending Tasks */}
          {groupedTasks.PENDING && groupedTasks.PENDING.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                  Pending Tasks ({groupedTasks.PENDING.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedTasks.PENDING.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 border border-border rounded-xl hover:shadow-card cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{task.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground ml-4">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* In Progress Tasks */}
          {groupedTasks.IN_PROGRESS && groupedTasks.IN_PROGRESS.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  In Progress ({groupedTasks.IN_PROGRESS.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedTasks.IN_PROGRESS.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 border border-border rounded-xl hover:shadow-card cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{task.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground ml-4">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completed Tasks */}
          {groupedTasks.COMPLETED && groupedTasks.COMPLETED.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                  Completed ({groupedTasks.COMPLETED.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedTasks.COMPLETED.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 border border-border rounded-xl hover:shadow-card cursor-pointer transition-all opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground line-through">{task.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      </div>
                      {task.completedAt && (
                        <span className="text-xs text-muted-foreground ml-4">
                          Completed: {formatDate(task.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Overdue Tasks */}
          {groupedTasks.OVERDUE && groupedTasks.OVERDUE.length > 0 && (
            <Card className="border-danger/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-danger">
                  <div className="w-3 h-3 bg-danger rounded-full animate-pulse"></div>
                  Overdue Tasks ({groupedTasks.OVERDUE.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedTasks.OVERDUE.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 border border-danger/30 rounded-xl hover:shadow-card cursor-pointer transition-all bg-danger/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{task.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-danger font-semibold ml-4">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
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
