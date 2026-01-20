'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { CardSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import UserAvatar from '@/components/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      color: 'bg-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Completion Rate',
      value: `${analytics?.completionRate || 0}%`,
      icon: FiCheckSquare,
      color: 'bg-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Avg. Time per Task',
      value: analytics?.avgTimePerTask ? `${analytics.avgTimePerTask}h` : 'N/A',
      icon: FiClock,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Active Employees',
      value: analytics?.activeEmployees || 0,
      icon: FiUsers,
      color: 'bg-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  const statusDistribution = [
    { status: 'TODO', count: analytics?.statusDistribution?.TODO || 0, color: 'bg-muted-foreground' },
    { status: 'IN_PROGRESS', count: analytics?.statusDistribution?.IN_PROGRESS || 0, color: 'bg-primary' },
    { status: 'UNDER_REVIEW', count: analytics?.statusDistribution?.UNDER_REVIEW || 0, color: 'bg-warning' },
    { status: 'COMPLETED', count: analytics?.statusDistribution?.COMPLETED || 0, color: 'bg-success' },
    { status: 'REJECTED', count: analytics?.statusDistribution?.REJECTED || 0, color: 'bg-danger' },
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
              <Card
                key={index}
                className="overflow-hidden animate-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  {/* <div className={`absolute inset-0 ${stat.bgColor} opacity-50`}></div> */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-card`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Employee Performance Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiUsers className="text-primary" />
              Employee Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CardSkeleton />
            ) : (
              <div className="space-y-4">
                {analytics?.employeePerformance && analytics.employeePerformance.length > 0 ? (
                  analytics.employeePerformance.slice(0, 5).map((emp, index) => (
                    <div
                      key={emp.userId}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border hover:shadow-card transition-all"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? 'bg-warning text-white'
                            : index === 1
                            ? 'bg-muted-foreground text-white'
                            : index === 2
                            ? 'bg-orange-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>
                      
                      <UserAvatar user={emp.user || { name: emp.userName }} size="sm" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">{emp.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          {emp.completedTasks} of {emp.totalTasks} tasks completed
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{emp.completionRate}%</div>
                        {emp.avgTime > 0 && (
                          <div className="text-xs text-muted-foreground">{emp.avgTime}h avg</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState message="No employee data available" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiActivity className="text-purple-500" />
              Task Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                          <span className="font-medium text-foreground">
                            {status.status.replace('_', ' ')}
                          </span>
                          <span className="text-muted-foreground">
                            {status.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${status.color} rounded-full transition-all duration-500 animate-in slide-in-from-left`}
                            style={{
                              width: `${percentage}%`,
                              animationDelay: `${index * 100}ms`,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Total Tasks</span>
                    <span className="text-2xl font-bold text-foreground">{totalStatusCount}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiClock className="text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="space-y-4">
              {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                analytics.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:shadow-card transition-all"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{activity.taskTitle}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Status: {activity.action} • {activity.userName}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="No recent activity" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}