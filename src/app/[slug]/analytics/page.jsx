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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AnalyticsPage() {
  const params = useParams();

  // Fetch comprehensive analytics data - Real-time updates via Socket.IO
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', params.slug],
    queryFn: async () => {
      const response = await apiClient.get('/tasks/analytics');
      return response.data.data.analytics;
    },
    staleTime: 30000, // Data stays fresh for 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds for real-time updates
  });

  // Fetch employees for additional context
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', params.slug],
    queryFn: async () => {
      const response = await apiClient.get(`/users/organization/${params.slug}`);
      return response.data;
    },
  });

  const isLoading = analyticsLoading || employeesLoading;
  const analytics = analyticsData;

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
    { status: 'PENDING', count: analytics?.statusDistribution?.PENDING || 0, color: 'bg-muted-foreground' },
    { status: 'ACCEPTED', count: analytics?.statusDistribution?.ACCEPTED || 0, color: 'bg-blue-500' },
    { status: 'IN_PROGRESS', count: analytics?.statusDistribution?.IN_PROGRESS || 0, color: 'bg-primary' },
    { status: 'SUBMITTED', count: analytics?.statusDistribution?.SUBMITTED || 0, color: 'bg-warning' },
    { status: 'COMPLETED', count: analytics?.statusDistribution?.COMPLETED || 0, color: 'bg-success' },
    { status: 'REJECTED', count: analytics?.statusDistribution?.REJECTED || 0, color: 'bg-danger' },
    { status: 'OVERDUE', count: analytics?.statusDistribution?.OVERDUE || 0, color: 'bg-red-600' },
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
                        <div className="text-xs text-muted-foreground mt-1">
                          {emp.avgTimeCreationToComplete > 0 && (
                            <span>⏱️ {emp.avgTimeCreationToComplete}h avg total time</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{emp.completionRate}%</div>
                        {emp.avgTimeStartToComplete > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {emp.avgTimeStartToComplete}h work time
                          </div>
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

      {/* Time Metrics Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiClock className="text-primary" />
            Task Completion Time Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <FiClock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Time</p>
                    <p className="text-xs text-muted-foreground">(Creation → Completion)</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {analytics?.timeMetrics?.avgCreationToComplete || 0}h
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Average time from task creation to completion
                </p>
              </div>

              <div className="p-6 rounded-xl bg-success/5 border border-success/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-success rounded-xl flex items-center justify-center">
                    <FiCheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                    <p className="text-xs text-muted-foreground">(Accept → Completion)</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {analytics?.timeMetrics?.avgAcceptToComplete || 0}h
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Average time from acceptance to completion
                </p>
              </div>

              <div className="p-6 rounded-xl bg-warning/5 border border-warning/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-warning rounded-xl flex items-center justify-center">
                    <FiActivity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Work Time</p>
                    <p className="text-xs text-muted-foreground">(Start → Completion)</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {analytics?.timeMetrics?.avgStartToComplete || 0}h
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Average actual work time on tasks
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiBarChart2 className="text-purple-500" />
              Status Distribution Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CardSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution.filter(s => s.count > 0)}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((entry, index) => {
                      const colorMap = {
                        'bg-muted-foreground': '#6B7280',
                        'bg-blue-500': '#3B82F6',
                        'bg-primary': '#3B82F6',
                        'bg-warning': '#F59E0B',
                        'bg-success': '#10B981',
                        'bg-danger': '#EF4444',
                        'bg-red-600': '#DC2626',
                      };
                      return <Cell key={`cell-${index}`} fill={colorMap[entry.color] || '#3B82F6'} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Performers Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiTrendingUp className="text-success" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CardSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.employeePerformance?.slice(0, 5) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="userName" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completionRate" fill="#10B981" name="Completion Rate %" />
                  <Bar dataKey="completedTasks" fill="#3B82F6" name="Completed Tasks" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee Time Analysis Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiClock className="text-purple-500" />
            Employee Time Analysis (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analytics?.employeePerformance?.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="userName" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgTimeCreationToComplete" fill="#3B82F6" name="Total Time (hours)" />
                <Bar dataKey="avgTimeAcceptToComplete" fill="#10B981" name="Response Time (hours)" />
                <Bar dataKey="avgTimeStartToComplete" fill="#F59E0B" name="Work Time (hours)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiAlertCircle className="text-warning" />
            Task Priority Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['HIGH', 'MEDIUM', 'LOW'].map((priority, index) => {
                const count = analytics?.priorityDistribution?.[priority] || 0;
                const total = analytics?.totalTasks || 1;
                const percentage = Math.round((count / total) * 100);
                const colors = {
                  HIGH: { bg: 'bg-danger/10', text: 'text-danger', bar: 'bg-danger' },
                  MEDIUM: { bg: 'bg-warning/10', text: 'text-warning', bar: 'bg-warning' },
                  LOW: { bg: 'bg-success/10', text: 'text-success', bar: 'bg-success' },
                };
                const colorSet = colors[priority];

                return (
                  <div key={priority} className={`p-6 rounded-xl ${colorSet.bg} border border-border`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-lg font-bold ${colorSet.text}`}>{priority}</span>
                      <span className="text-3xl font-bold text-foreground">{count}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorSet.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{percentage}% of total tasks</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                        {activity.priority && (
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                            activity.priority === 'HIGH' ? 'bg-danger/20 text-danger' :
                            activity.priority === 'MEDIUM' ? 'bg-warning/20 text-warning' :
                            'bg-success/20 text-success'
                          }`}>
                            {activity.priority}
                          </span>
                        )}
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