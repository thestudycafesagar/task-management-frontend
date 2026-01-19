'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { CardSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import UserAvatar from '@/components/UserAvatar';
import apiClient from '@/lib/api';
import { FiBarChart2, FiTrendingUp, FiUsers, FiCheckSquare, FiClock, FiAlertCircle, FiActivity } from 'react-icons/fi';

export default function AnalyticsPage() {
  const params = useParams();

  // Fetch tasks for analytics - Real-time updates via Socket.IO
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', params.slug],
    queryFn: async () => {
      const response = await apiClient.get('/tasks');
      return response.data.data.tasks;
    },
    staleTime: 60000, // Data stays fresh for 60 seconds
  });

  // Fetch employees
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', params.slug],
    queryFn: async () => {
      const response = await apiClient.get(`/users/organization/${params.slug}`);
      return response.data;
    },
  });

  const isLoading = tasksLoading || employeesLoading;

  // Calculate analytics from real task data
  const calculateAnalytics = () => {
    if (!tasksData) return null;

    const tasks = tasksData;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todoTasks = tasks.filter(t => t.status === 'TODO').length;
    const reviewTasks = tasks.filter(t => t.status === 'UNDER_REVIEW').length;
    const rejectedTasks = tasks.filter(t => t.status === 'REJECTED').length;

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate average time for completed tasks
    const completedWithTime = tasks.filter(t => 
      t.status === 'COMPLETED' && t.acceptedAt && t.completedAt
    );
    
    let avgTimePerTask = 0;
    if (completedWithTime.length > 0) {
      const totalHours = completedWithTime.reduce((sum, task) => {
        const hours = (new Date(task.completedAt) - new Date(task.acceptedAt)) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      avgTimePerTask = Math.round(totalHours / completedWithTime.length);
    }

    // Employee performance
    const employeeStats = {};
    tasks.forEach(task => {
      const empId = task.assignedTo?._id || task.assignedTo;
      if (!empId) return;

      if (!employeeStats[empId]) {
        employeeStats[empId] = {
          userId: empId,
          userName: task.assignedTo?.name || 'Unknown',
          user: task.assignedTo,
          totalTasks: 0,
          completedTasks: 0,
          totalTime: 0,
          taskCount: 0,
        };
      }

      employeeStats[empId].totalTasks++;
      if (task.status === 'COMPLETED') {
        employeeStats[empId].completedTasks++;
        
        if (task.acceptedAt && task.completedAt) {
          const hours = (new Date(task.completedAt) - new Date(task.acceptedAt)) / (1000 * 60 * 60);
          employeeStats[empId].totalTime += hours;
          employeeStats[empId].taskCount++;
        }
      }
    });

    const employeePerformance = Object.values(employeeStats)
      .map(emp => ({
        ...emp,
        avgTime: emp.taskCount > 0 ? Math.round(emp.totalTime / emp.taskCount) : 0,
        completionRate: emp.totalTasks > 0 ? Math.round((emp.completedTasks / emp.totalTasks) * 100) : 0,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);

    // Recent activity
    const recentActivity = [...tasks]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10)
      .map(task => ({
        taskTitle: task.title,
        action: task.status,
        userName: task.assignedTo?.name || 'Unknown',
        timestamp: task.updatedAt,
      }));

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      rejectedTasks,
      completionRate,
      avgTimePerTask,
      activeEmployees: Object.keys(employeeStats).length,
      employeePerformance,
      recentActivity,
      statusDistribution: {
        TODO: todoTasks,
        IN_PROGRESS: inProgressTasks,
        UNDER_REVIEW: reviewTasks,
        COMPLETED: completedTasks,
        REJECTED: rejectedTasks,
      },
    };
  };

  const analytics = calculateAnalytics();

  const stats = [
    {
      label: 'Total Tasks',
      value: analytics?.totalTasks || 0,
      icon: FiActivity,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-indigo-50',
    },
    {
      label: 'Completion Rate',
      value: `${analytics?.completionRate || 0}%`,
      icon: FiCheckSquare,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      bgColor: 'from-green-50 to-emerald-50',
    },
    {
      label: 'Avg. Time per Task',
      value: analytics?.avgTimePerTask ? `${analytics.avgTimePerTask}h` : 'N/A',
      icon: FiClock,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-pink-50',
    },
    {
      label: 'Active Employees',
      value: analytics?.activeEmployees || 0,
      icon: FiUsers,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-red-50',
    },
  ];

  const statusDistribution = [
    { status: 'TODO', count: analytics?.statusDistribution?.TODO || 0, color: 'bg-gray-500' },
    { status: 'IN_PROGRESS', count: analytics?.statusDistribution?.IN_PROGRESS || 0, color: 'bg-blue-500' },
    { status: 'UNDER_REVIEW', count: analytics?.statusDistribution?.UNDER_REVIEW || 0, color: 'bg-yellow-500' },
    { status: 'COMPLETED', count: analytics?.statusDistribution?.COMPLETED || 0, color: 'bg-green-500' },
    { status: 'REJECTED', count: analytics?.statusDistribution?.REJECTED || 0, color: 'bg-red-500' },
  ];

  const totalStatusCount = statusDistribution.reduce((sum, s) => sum + s.count, 0);

  return (
    <AppLayout>
      <PageHeader
        title="Analytics Dashboard"
        description="Monitor employee performance and task metrics in real-time"
      />

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                style={{
                  animation: `slideUp 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-50`}></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Employee Performance Leaderboard */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FiUsers className="text-indigo-600" />
            Employee Performance
          </h3>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="space-y-4">
              {analytics?.employeePerformance && analytics.employeePerformance.length > 0 ? (
                analytics.employeePerformance.slice(0, 5).map((emp, index) => (
                  <div
                    key={emp.userId}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white'
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                          : index === 2
                          ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    
                    <UserAvatar user={emp.user || { name: emp.userName }} size="sm" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{emp.userName}</div>
                      <div className="text-sm text-gray-500">
                        {emp.completedTasks} of {emp.totalTasks} tasks completed
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">{emp.completionRate}%</div>
                      {emp.avgTime > 0 && (
                        <div className="text-xs text-gray-500">{emp.avgTime}h avg</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="No employee data available" />
              )}
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FiActivity className="text-purple-600" />
            Task Status Distribution
          </h3>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <>
              <div className="space-y-4">
                {statusDistribution.map((status, index) => {
                  const percentage = totalStatusCount > 0 ? Math.round((status.count / totalStatusCount) * 100) : 0;
                  
                  return (
                    <div key={status.status} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          {status.status.replace('_', ' ')}
                        </span>
                        <span className="text-gray-500">
                          {status.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${status.color} rounded-full transition-all duration-500`}
                          style={{
                            width: `${percentage}%`,
                            animation: `expandWidth 0.8s ease-out ${index * 0.1}s both`,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total Tasks</span>
                  <span className="text-2xl font-bold text-gray-900">{totalStatusCount}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <FiClock className="text-blue-600" />
          Recent Activity
        </h3>
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <div className="space-y-4">
            {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-md transition-all"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{activity.taskTitle}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Status: {activity.action} • {activity.userName}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No recent activity" />
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes expandWidth {
          from {
            width: 0;
          }
        }
      `}</style>
    </AppLayout>
  );
}