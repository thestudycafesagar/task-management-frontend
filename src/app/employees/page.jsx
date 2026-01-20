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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'default';
      case 'EMPLOYEE':
        return 'secondary';
      default:
        return 'success';
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Team Members"
        description="Manage your team and their roles"
        action={
          <Button
            onClick={() => setShowModal(true)}
            className="gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Add Employee
          </Button>
        }
      />

      {/* Employees Grid */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : employeesData && employeesData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeesData.map((employee, index) => (
                <TableRow 
                  key={employee._id}
                  className="group"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar user={employee} size="md" />
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {employee.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          ID: {employee._id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FiMail className="w-4 h-4" />
                      <span className="text-sm">{employee.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FiShield className="w-4 h-4 text-primary" />
                      <Badge variant={getRoleBadgeVariant(employee.role)}>
                        {employee.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {employee.isActive ? (
                        <Badge variant="success" className="gap-1">
                          <FiCheck className="w-3.5 h-3.5" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="gap-1">
                          <FiX className="w-3.5 h-3.5" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleDeleteClick(employee)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors group"
                        title="Delete employee"
                      >
                        <FiTrash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12">
            <EmptyState
              icon={FiUsers}
              title="No employees yet"
              description="Add your first team member to start collaborating"
            />
          </div>
        )}
      </Card>

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
