'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import EmployeeModal from '@/components/EmployeeModal';
import { TableSkeleton, CardSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import apiClient from '@/lib/api';
import { FiUsers, FiPlus, FiEdit2 } from 'react-icons/fi';

export default function EmployeesPage() {
  const params = useParams();
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Fetch employees
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', params.slug],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      return response.data.data.employees;
    },
  });

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'default';
      case 'EMPLOYEE':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Employees"
        description="Manage your team members"
        action={
          <Button onClick={() => setShowModal(true)}>
            <FiPlus className="w-5 h-5 mr-2" />
            Add Employee
          </Button>
        }
      />

      {/* Employees Table - Desktop */}
      <Card className="hidden md:block">
        {isLoading ? (
          <CardContent className="p-6">
            <TableSkeleton rows={5} />
          </CardContent>
        ) : employeesData && employeesData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeesData.map((employee) => (
                <TableRow key={employee._id}>
                  <TableCell className="font-medium text-foreground">
                    {employee.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(employee.role)}>
                      {employee.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.isActive ? 'success' : 'danger'}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(employee)}
                    >
                      <FiEdit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CardContent className="p-6">
            <EmptyState
              icon={FiUsers}
              title="No employees yet"
              description="Add employees to start assigning tasks"
            />
          </CardContent>
        )}
      </Card>

      {/* Employees Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <CardSkeleton />
        ) : employeesData && employeesData.length > 0 ? (
          employeesData.map((employee) => (
            <Card key={employee._id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{employee.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(employee)}
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(employee.role)}>
                    {employee.role}
                  </Badge>
                  <Badge variant={employee.isActive ? 'success' : 'danger'}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <EmptyState
              icon={FiUsers}
              title="No employees yet"
              description="Add employees to start assigning tasks"
            />
          </Card>
        )}
      </div>

      {/* Employee Modal */}
      <EmployeeModal 
        isOpen={showModal} 
        onClose={handleCloseModal}
        employee={selectedEmployee}
      />
    </AppLayout>
  );
}
