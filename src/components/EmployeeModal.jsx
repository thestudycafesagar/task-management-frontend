'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';
import { FiX, FiUser, FiMail, FiLock, FiUserCheck, FiPlus, FiCheck, FiTrash2, FiShield } from 'react-icons/fi';
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slideIn">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <FiUser className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update employee information' : 'Create an employee account for your team'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"></div>
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="relative w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                  placeholder="John Doe"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"></div>
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="relative w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                  placeholder="john@company.com"
                  disabled={isPending || isEditMode}
                />
              </div>
              {isEditMode && (
                <p className="text-xs text-gray-500 mt-1.5">
                  Email cannot be changed after account creation
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                Password {isEditMode && <span className="text-xs text-gray-500 font-normal">(leave blank to keep current)</span>}
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"></div>
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="relative w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                  placeholder={isEditMode ? "Leave blank to keep current" : "Min. 8 characters"}
                  disabled={isPending}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <span>🔒</span>
                <span>{isEditMode ? 'Only fill if you want to change the password' : 'Employee will use this password to login'}</span>
              </p>
            </div>

            {/* Role */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                Role
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"></div>
                <FiUserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                <select
                  value={formData.role}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setShowCustomRole(true);
                    } else {
                      setFormData({ ...formData, role: e.target.value });
                    }
                  }}
                  className="relative w-full pl-12 pr-10 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer font-medium bg-white"
                  disabled={isPending}
                >
                  <option value="EMPLOYEE" className="py-2">👤 Employee</option>
                  <option value="ADMIN" className="py-2">👑 Admin</option>
                  {customRoles.map((role) => (
                    <option key={role} value={role} className="py-2">⭐ {role}</option>
                  ))}
                  <option value="__CREATE_NEW__" className="text-indigo-600 font-semibold py-2">
                    ➕ Create New Role
                  </option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <svg className="w-5 h-5 text-indigo-500 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {/* Existing Custom Roles - Manage */}
              {customRoles.length > 0 && (
                <div className="mt-3 p-3 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl border border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                    <span>⭐</span>
                    <span>Custom Roles</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customRoles.map((role) => (
                      <div
                        key={role}
                        className="group/role flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-indigo-200 rounded-lg hover:border-indigo-400 transition-all"
                      >
                        <span className="text-sm font-medium text-gray-700">{role}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(role)}
                          className="opacity-0 group-hover/role:opacity-100 p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                          title="Delete role"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Hover over a role to delete it</span>
                  </p>
                </div>
              )}
              
              {/* Custom Role Input */}
              {showCustomRole && (
                <div className="mt-3 p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-300 animate-slideIn shadow-lg">
                  <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    <span>Create Custom Role</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
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
                      className="flex-1 px-4 py-2.5 border-2 border-indigo-400 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 outline-none transition-all text-sm font-medium bg-white shadow-sm"
                      placeholder="e.g., Developer, Designer, Sales Manager"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddCustomRole}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                      >
                        <FiCheck className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomRole(false);
                          setCustomRole('');
                        }}
                        className="flex-1 sm:flex-none px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-white/60 backdrop-blur rounded-lg border border-indigo-200">
                    <p className="text-xs text-indigo-700 font-medium flex items-center gap-1.5">
                      <span>💡</span>
                      <span>Create roles like Developer, Designer, Manager, QA Tester, etc.</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1 ml-5">
                      Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Enter</kbd> to add • <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Esc</kbd> to cancel
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Super Admin Force Password Change (Only when impersonating) */}
            {isEditMode && isImpersonating && (
              <div className="mt-6 p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl border-2 border-amber-300">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiShield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      Super Admin Powers
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">IMPERSONATING</span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Change password without current password verification
                    </p>
                  </div>
                </div>
                
                {!showForcePasswordChange ? (
                  <button
                    type="button"
                    onClick={() => setShowForcePasswordChange(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <FiLock className="w-5 h-5" />
                    Force Change Password
                  </button>
                ) : (
                  <div className="space-y-3 animate-slideIn">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                        New Password
                      </label>
                      <div className="relative group">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors z-10" />
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="relative w-full pl-12 pr-4 py-3.5 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 outline-none transition-all font-medium"
                          placeholder="Enter new password (min. 8 characters)"
                          disabled={isPending}
                        />
                      </div>
                      <p className="text-xs text-amber-700 mt-1.5 flex items-center gap-1 bg-amber-100 px-2 py-1 rounded">
                        <span>⚠️</span>
                        <span>No current password needed - Super Admin privilege</span>
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleForcePasswordChange}
                        disabled={isPending}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {forcePasswordMutation.isPending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Changing...</span>
                          </>
                        ) : (
                          <>
                            <FiCheck className="w-5 h-5" />
                            <span>Change Password</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForcePasswordChange(false);
                          setFormData({ ...formData, password: '' });
                        }}
                        disabled={isPending}
                        className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <ButtonLoader />
                ) : (
                  <>
                    <FiUserCheck className="w-5 h-5" />
                    {isEditMode ? 'Update Employee' : 'Create Employee'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
