'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';
import { FiX, FiUser, FiMail, FiLock, FiUserCheck, FiPlus, FiCheck, FiTrash2, FiShield } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ButtonLoader from './ButtonLoader';

// Load custom roles from localStorage
const loadCustomRoles = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('customRoles');
    return saved ? JSON.parse(saved) : ['Developer', 'Designer', 'Sales', 'Marketing'];
  }
  return ['Developer', 'Designer', 'Sales', 'Marketing'];
};

// Save custom roles to localStorage
const saveCustomRoles = (roles) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('customRoles', JSON.stringify(roles));
  }
};

export default function EmployeeModal({ isOpen, onClose, employee }) {
  const queryClient = useQueryClient();
  const { isImpersonating } = useAuthStore();
  const isEditMode = !!employee;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE'
  });
  
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [customRole, setCustomRole] = useState('');
  const [customRoles, setCustomRoles] = useState(loadCustomRoles());
  const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        password: '', // Never populate password
        role: employee.role || 'EMPLOYEE'
      });
      
      // Add custom role to list if not already present
      if (employee.role && !['EMPLOYEE', 'ADMIN'].includes(employee.role) && !customRoles.includes(employee.role)) {
        setCustomRoles([...customRoles, employee.role]);
      }
    } else {
      setFormData({ name: '', email: '', password: '', role: 'EMPLOYEE' });
    }
  }, [employee]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Employee created successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      handleClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create employee');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.patch(`/users/${employee._id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Employee updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      handleClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    }
  });

  const forcePasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }) => {
      const response = await apiClient.post(`/users/${userId}/force-change-password`, {
        newPassword
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('🔐 Password changed successfully!');
      setFormData({ ...formData, password: '' });
      setShowForcePasswordChange(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  });

  const handleClose = () => {
    setFormData({ name: '', email: '', password: '', role: 'EMPLOYEE' });
    setShowCustomRole(false);
    setCustomRole('');
    setShowForcePasswordChange(false);
    onClose();
  };

  const handleAddCustomRole = () => {
    if (!customRole.trim()) {
      toast.error('Please enter a role name');
      return;
    }
    
    if (customRoles.includes(customRole.trim())) {
      toast.error('Role already exists');
      return;
    }
    
    const newRoles = [...customRoles, customRole.trim()];
    setCustomRoles(newRoles);
    saveCustomRoles(newRoles);
    setFormData({ ...formData, role: customRole.trim() });
    setCustomRole('');
    setShowCustomRole(false);
    toast.success('✨ Custom role added!');
  };

  const handleDeleteRole = (roleToDelete) => {
    if (roleToDelete === 'EMPLOYEE' || roleToDelete === 'ADMIN') {
      toast.error('Cannot delete default roles');
      return;
    }
    
    const newRoles = customRoles.filter(r => r !== roleToDelete);
    setCustomRoles(newRoles);
    saveCustomRoles(newRoles);
    
    // If the deleted role was selected, reset to EMPLOYEE
    if (formData.role === roleToDelete) {
      setFormData({ ...formData, role: 'EMPLOYEE' });
    }
    
    toast.success('🗑️ Role deleted');
  };

  const handleForcePasswordChange = (e) => {
    e.preventDefault();
    
    if (!formData.password) {
      toast.error('Please enter new password');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    forcePasswordMutation.mutate({
      userId: employee._id,
      newPassword: formData.password
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isEditMode && !formData.password) {
      toast.error('Password is required for new employees');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (isEditMode) {
      // For update, only send fields that should be updated
      const updateData = {
        name: formData.name,
        role: formData.role,
      };
      // Only include password if it was provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || forcePasswordMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-card rounded-2xl shadow-float border border-border max-w-md w-full p-8 animate-slideIn">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <FiUser className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {isEditMode ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isEditMode ? 'Update employee information' : 'Create an employee account for your team'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Full Name
              </Label>
              <div className="relative group">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  placeholder="John Doe"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Email Address
              </Label>
              <div className="relative group">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  placeholder="john@company.com"
                  disabled={isPending || isEditMode}
                />
              </div>
              {isEditMode && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Email cannot be changed after account creation
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Password {isEditMode && <span className="text-xs text-muted-foreground font-normal">(leave blank to keep current)</span>}
              </Label>
              <div className="relative group">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  placeholder={isEditMode ? "Leave blank to keep current" : "Min. 8 characters"}
                  disabled={isPending}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <span>🔒</span>
                <span>{isEditMode ? 'Only fill if you want to change the password' : 'Employee will use this password to login'}</span>
              </p>
            </div>

            {/* Role */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Role
              </Label>
              <div className="relative group">
                <FiUserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <select
                  value={formData.role}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setShowCustomRole(true);
                    } else {
                      setFormData({ ...formData, role: e.target.value });
                    }
                  }}
                  className="w-full h-10 pl-10 pr-10 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all appearance-none cursor-pointer"
                  disabled={isPending}
                >
                  <option value="EMPLOYEE">👤 Employee</option>
                  <option value="ADMIN">👑 Admin</option>
                  {customRoles.map((role) => (
                    <option key={role} value={role}>⭐ {role}</option>
                  ))}
                  <option value="__CREATE_NEW__" className="text-primary font-semibold">
                    ➕ Create New Role
                  </option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {/* Existing Custom Roles - Manage */}
              {customRoles.length > 0 && (
                <div className="mt-3 p-3 bg-accent/50 rounded-xl border border-border">
                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <span>⭐</span>
                    <span>Custom Roles</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customRoles.map((role) => (
                      <div
                        key={role}
                        className="group/role flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg hover:border-primary/50 transition-all"
                      >
                        <span className="text-sm font-medium text-foreground">{role}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(role)}
                          className="opacity-0 group-hover/role:opacity-100 p-0.5 text-destructive hover:text-destructive hover:bg-destructive/10 rounded transition-all"
                          title="Delete role"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Hover over a role to delete it</span>
                  </p>
                </div>
              )}
              
              {/* Custom Role Input */}
              {showCustomRole && (
                <div className="mt-3 p-4 bg-primary/5 rounded-xl border border-primary/30 animate-slideIn">
                  <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    <span>Create Custom Role</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomRole();
                        } else if (e.key === 'Escape') {
                          setShowCustomRole(false);
                          setCustomRole('');
                        }
                      }}
                      placeholder="e.g., Developer, Designer, Sales Manager"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleAddCustomRole}
                        className="flex-1 sm:flex-none gap-2"
                      >
                        <FiCheck className="w-4 h-4" />
                        <span>Add</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCustomRole(false);
                          setCustomRole('');
                        }}
                        size="icon"
                      >
                        <FiX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-background/60 rounded-lg border border-border">
                    <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                      <span>💡</span>
                      <span>Create roles like Developer, Designer, Manager, QA Tester, etc.</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 ml-5">
                      Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> to add • <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd> to cancel
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Super Admin Force Password Change (Only when impersonating) */}
            {isEditMode && isImpersonating && (
              <div className="mt-6 p-5 bg-warning/5 rounded-2xl border border-warning/30">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiShield className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      Super Admin Powers
                      <span className="px-2 py-0.5 bg-warning text-warning-foreground text-xs rounded-full font-bold">IMPERSONATING</span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Change password without current password verification
                    </p>
                  </div>
                </div>
                
                {!showForcePasswordChange ? (
                  <Button
                    type="button"
                    onClick={() => setShowForcePasswordChange(true)}
                    className="w-full bg-warning text-warning-foreground hover:bg-warning/90 gap-2"
                  >
                    <FiLock className="w-5 h-5" />
                    Force Change Password
                  </Button>
                ) : (
                  <div className="space-y-3 animate-slideIn">
                    <div>
                      <Label className="mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-warning rounded-full"></span>
                        New Password
                      </Label>
                      <div className="relative group">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-warning transition-colors z-10" />
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="pl-10 border-warning/50 focus:border-warning"
                          placeholder="Enter new password (min. 8 characters)"
                          disabled={isPending}
                        />
                      </div>
                      <p className="text-xs text-warning mt-1.5 flex items-center gap-1 bg-warning/10 px-2 py-1 rounded">
                        <span>⚠️</span>
                        <span>No current password needed - Super Admin privilege</span>
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleForcePasswordChange}
                        disabled={isPending}
                        className="flex-1 bg-warning text-warning-foreground hover:bg-warning/90 gap-2"
                      >
                        {forcePasswordMutation.isPending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Changing...</span>
                          </>
                        ) : (
                          <>
                            <FiCheck className="w-5 h-5" />
                            <span>Change Password</span>
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowForcePasswordChange(false);
                          setFormData({ ...formData, password: '' });
                        }}
                        disabled={isPending}
                        size="icon"
                      >
                        <FiX className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 gap-2"
              >
                {isPending ? (
                  <ButtonLoader />
                ) : (
                  <>
                    <FiUserCheck className="w-5 h-5" />
                    {isEditMode ? 'Update Employee' : 'Create Employee'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
