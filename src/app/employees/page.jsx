'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import EmployeeModal from '@/components/EmployeeModal';
import UserAvatar from '@/components/UserAvatar';
import { TableSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import apiClient from '@/lib/api';
import { FiUsers, FiPlus, FiMail, FiShield, FiCheck, FiX, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function EmployeesPage() {
  const [showModal, setShowModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, employee: null });
  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employeesData, isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      return response.data.data.employees;
    },
    staleTime: 0, // Treat data as stale immediately
    cacheTime: 0, // Don't cache the data
  });

  const handleEmployeeAdded = () => {
    // Refetch the employees list when modal closes
    refetch();
  };

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: async (employeeId) => {
      const response = await apiClient.delete(`/users/${employeeId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
      setDeleteDialog({ isOpen: false, employee: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    }
  });

  const handleDeleteClick = (employee) => {
    setDeleteDialog({ isOpen: true, employee });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.employee) {
      deleteMutation.mutate(deleteDialog.employee._id);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0';
      case 'EMPLOYEE':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0';
      default:
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0';
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Team Members"
        description="Manage your team and their roles"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] font-semibold"
          >
            <FiPlus className="w-5 h-5" />
            Add Employee
          </button>
        }
      />

      {/* Employees Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : employeesData && employeesData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employeesData.map((employee, index) => (
                  <tr 
                    key={employee._id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={employee} size="md" />
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {employee.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            ID: {employee._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiMail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{employee.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiShield className="w-4 h-4 text-indigo-500" />
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${getRoleBadgeColor(employee.role)}`}>
                          {employee.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {employee.isActive ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                            <FiCheck className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm">
                            <FiX className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleDeleteClick(employee)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                          title="Delete employee"
                        >
                          <FiTrash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12">
            <EmptyState
              icon={FiUsers}
              title="No employees yet"
              description="Add your first team member to start collaborating"
            />
          </div>
        )}
      </div>

      {/* Employee Modal */}
      <EmployeeModal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          handleEmployeeAdded(); // Refetch after modal closes
        }} 
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, employee: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee"
        description={`Are you sure you want to delete ${deleteDialog.employee?.name}? This action will deactivate their account.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </AppLayout>
  );
}
