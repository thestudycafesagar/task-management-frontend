'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiSave, FiBriefcase, FiBell, FiShield, FiEye, FiEyeOff } from 'react-icons/fi';

export default function SettingsPage() {
  const params = useParams();
  const { user, organization, isImpersonating, hasAdminPrivileges } = useAuthStore();
  
  // Super admin impersonating gets full admin access via hasAdminPrivileges
  const hasAdminAccess = hasAdminPrivileges || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  
  const isEmployee = !hasAdminAccess;
  const [activeTab, setActiveTab] = useState(isEmployee ? 'notifications' : 'profile');

  // Filter tabs based on role
  const allTabs = [
    { id: 'profile', label: 'Profile', icon: FiUser, adminOnly: true },
    { id: 'company', label: 'Company', icon: FiBriefcase, adminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: FiBell, adminOnly: false },
    { id: 'security', label: 'Security', icon: FiShield, adminOnly: false }, // Now available to employees
  ];

  // When impersonating or admin, super admin gets full access
  const tabs = isEmployee
    ? allTabs.filter(tab => !tab.adminOnly)
    : allTabs;

  return (
    <AppLayout>
      <PageHeader
        title="Settings"
        description={isEmployee ? "Manage your notification preferences" : "Manage your account and preferences"}
      />

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'company' && <CompanySettings organization={organization} />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
        </div>
      </div>
    </AppLayout>
  );
}

function ProfileSettings({ user }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.patch('/users/profile', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      // Refresh the page to re-render all components with updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-12"
                placeholder="Your name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-12"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setFormData({ name: user?.name || '', email: user?.email || '' })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CompanySettings({ organization }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Company Name</Label>
          <div className="relative">
            <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              value={organization?.name || ''}
              readOnly
              className="pl-12 bg-muted"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Company Slug</Label>
          <div className="flex items-center gap-2">
            <code className="px-4 py-3 bg-muted border border-border rounded-xl text-foreground font-mono text-sm flex-1">
              /{organization?.slug || 'your-company'}
            </code>
          </div>
          <p className="text-xs text-muted-foreground">This is your unique company identifier in URLs</p>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Status:</strong>{' '}
            <Badge variant={organization?.isActive ? 'success' : 'danger'}>
              {organization?.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  const queryClient = useQueryClient();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  // Fetch user profile for notification settings
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user-profile-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/users/profile');
      return response.data.data.user;
    },
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskAssigned: true,
    taskUpdated: true,
    taskCompleted: true,
  });

  // Check if push notifications are enabled
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Initialize settings from profile data
  useEffect(() => {
    if (profileData?.notificationSettings) {
      setNotifications(profileData.notificationSettings);
    }
  }, [profileData]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings) => {
      const response = await apiClient.patch('/users/profile', {
        notificationSettings: newSettings,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile-settings']);
      toast.success('Notification preferences saved!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save preferences');
    },
  });

  const handleToggle = (key) => {
    const newSettings = {
      ...notifications,
      [key]: !notifications[key],
    };
    setNotifications(newSettings);
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(notifications);
  };

  const handleEnablePush = async () => {
    setIsRequestingPermission(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        toast.success('Push notifications enabled! Refresh the page to register your device.');
      } else {
        toast.error('Push notification permission denied');
      }
    } catch (error) {
      toast.error('Failed to enable push notifications');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-16 bg-muted rounded-xl"></div>
              <div className="h-16 bg-muted rounded-xl"></div>
              <div className="h-16 bg-muted rounded-xl"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Push Notification Status Banner */}
        {typeof window !== 'undefined' && 'Notification' in window && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${
            pushEnabled 
              ? 'bg-success/10 border-success/30' 
              : 'bg-warning/10 border-warning/30'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                pushEnabled ? 'bg-success/20' : 'bg-warning/20'
              }`}>
                <FiBell className={`w-5 h-5 ${pushEnabled ? 'text-success' : 'text-warning'}`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${pushEnabled ? 'text-success' : 'text-warning'}`}>
                  {pushEnabled ? '✅ Push Notifications Enabled' : '⚠️ Push Notifications Disabled'}
                </h3>
                <p className={`text-sm mt-1 ${pushEnabled ? 'text-success/80' : 'text-warning/80'}`}>
                  {pushEnabled 
                    ? 'You will receive notifications on this device, even when the app is closed.'
                    : 'Enable push notifications to receive alerts on your mobile phone and desktop.'}
                </p>
                {!pushEnabled && (
                  <Button
                    onClick={handleEnablePush}
                    disabled={isRequestingPermission}
                    className="mt-3"
                    size="sm"
                  >
                    {isRequestingPermission ? 'Requesting...' : '🔔 Enable Push Notifications'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-colors">
            <div>
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-colors">
            <div>
              <p className="font-medium text-foreground">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-colors">
            <div>
              <p className="font-medium text-foreground">Task Assigned</p>
              <p className="text-sm text-muted-foreground">When a task is assigned to you</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.taskAssigned}
                onChange={() => handleToggle('taskAssigned')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-colors">
            <div>
              <p className="font-medium text-foreground">Task Updated</p>
              <p className="text-sm text-muted-foreground">When a task you're working on is updated</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.taskUpdated}
                onChange={() => handleToggle('taskUpdated')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-colors">
            <div>
              <p className="font-medium text-foreground">Task Completed</p>
              <p className="text-sm text-muted-foreground">When a task is marked as completed</p>
          </div>
            <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.taskCompleted}
              onChange={() => handleToggle('taskCompleted')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <Button
          onClick={handleSave}
          disabled={updateSettingsMutation.isPending}
        >
          {updateSettingsMutation.isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <FiSave className="w-5 h-5 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
      </CardContent>
    </Card>
  );
}function SecuritySettings() {
  const queryClient = useQueryClient();
  const { user, isImpersonating, organization, hasAdminPrivileges } = useAuthStore();
  const hasAdminAccess = hasAdminPrivileges || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Fetch the organization admin whose password we want to change (admin only)
  const { data: targetAdmin } = useQuery({
    queryKey: ['target-admin', organization?._id, organization?.slug],
    queryFn: async () => {
      if (!isImpersonating || !organization?._id) return null;
      // Get all users to find the primary admin (organization creator)
      const response = await apiClient.get(`/users`);
      const users = response.data.data.employees || [];
      
      // Find the admin who created the organization (usually the first ADMIN or by createdAt)
      // Priority: 1. Admin with earliest createdAt, 2. First ADMIN role
      const admins = users.filter(u => u.role === 'ADMIN').sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Return the primary admin (earliest created)
      return admins.length > 0 ? admins[0] : null;
    },
    enabled: isImpersonating && !!organization?._id && hasAdminAccess
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      // If admin impersonating, use force change endpoint (no current password needed)
      if (isImpersonating && targetAdmin && hasAdminAccess) {
        // Use the primary admin's ID (organization creator)
        const response = await apiClient.post(`/users/${targetAdmin._id}/force-change-password`, {
          newPassword: data.newPassword
        });
        return response.data;
      } else {
        // Regular password change (for employees and admins changing their own password)
        const response = await apiClient.patch('/users/change-password', data);
        return response.data;
      }
    },
    onSuccess: () => {
      toast.success('🔐 Password changed successfully!');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      queryClient.invalidateQueries(['user-profile']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  });

  const handlePasswordChange = (e) => {
    e.preventDefault();

    // Validation
    if (!isImpersonating && !passwords.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (!passwords.newPassword || passwords.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Super Admin Badge - Only show for impersonating admins */}
        {isImpersonating && hasAdminAccess && (
          <div className="mb-6 p-4 bg-warning/10 border-2 border-warning/30 rounded-xl">
            <div className="flex items-center gap-2 text-warning">
              <FiShield className="w-5 h-5" />
              <span className="font-semibold">Super Admin Mode - Current password not required</span>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-6">
          {/* Current Password - Show for everyone except impersonating admins */}
          {!(isImpersonating && hasAdminAccess) && (
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="pl-12 pr-12"
                  placeholder="••••••••"
                  disabled={changePasswordMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.current ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPasswords.new ? "text" : "password"}
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="pl-12 pr-12"
                placeholder="••••••••"
                disabled={changePasswordMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.new ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
          </div>

          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="pl-12 pr-12"
                placeholder="••••••••"
                disabled={changePasswordMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.confirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Changing...
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
