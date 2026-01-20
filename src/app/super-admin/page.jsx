'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import SuperAdminNavbar from '@/components/SuperAdminNavbar';
import { TableSkeleton, CardSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { FiBriefcase, FiSearch, FiLogIn, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { formatDate } from '@/lib/utils';

export default function SuperAdminPage() {
  const router = useRouter();
  const { impersonate } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Fetch organizations
  const { data: orgsData, isLoading, refetch } = useQuery({
    queryKey: ['organizations', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const response = await apiClient.get(`/super-admin/organizations?${params.toString()}`);
      return response.data.data.organizations;
    },
  });

  const handleImpersonate = async (org) => {
    try {
      const data = await impersonate(org._id);
      toast.success(`Now impersonating ${org.name}`);
      router.push(data.redirectTo);
    } catch (error) {
      toast.error('Failed to impersonate organization');
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedOrg) return;

    try {
      setIsToggling(true);
      await apiClient.patch(`/super-admin/organizations/${selectedOrg._id}/toggle-status`);
      toast.success(`Organization ${selectedOrg.isActive ? 'disabled' : 'enabled'}`);
      refetch();
      setShowToggleDialog(false);
      setSelectedOrg(null);
    } catch (error) {
      toast.error('Failed to update organization status');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SuperAdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <FiBriefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Organizations</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage all organizations on the platform</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

      {/* Organizations Table - Desktop */}
      <Card className="hidden md:block overflow-hidden">
        {isLoading ? (
          <CardContent className="p-6">
            <TableSkeleton rows={5} />
          </CardContent>
        ) : orgsData && orgsData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-700 dark:text-gray-300">Organization</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Users</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgsData.map((org) => (
                  <TableRow key={org._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{org.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">/{org.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {org.adminCount} admins, {org.employeeCount} employees
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">{formatDate(org.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={org.isActive ? 'success' : 'danger'}>
                      {org.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImpersonate(org)}
                      >
                        <FiLogIn className="w-4 h-4 mr-1" />
                        Impersonate
                      </Button>
                      <Button
                        variant={org.isActive ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => {
                          setSelectedOrg(org);
                          setShowToggleDialog(true);
                        }}
                      >
                        {org.isActive ? (
                          <>
                            <FiToggleRight className="w-4 h-4 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <FiToggleLeft className="w-4 h-4 mr-1" />
                            Enable
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        ) : (
          <CardContent className="p-6">
            <EmptyState
              icon={FiBriefcase}
              title="No organizations found"
              description="No organizations match your search"
            />
          </CardContent>
        )}
      </Card>

      {/* Organizations Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <CardSkeleton />
        ) : orgsData && orgsData.length > 0 ? (
          orgsData.map((org) => (
            <Card key={org._id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{org.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">/{org.slug}</p>
                  </div>
                  <Badge variant={org.isActive ? 'success' : 'danger'}>
                    {org.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p>{org.adminCount} admins, {org.employeeCount} employees</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{formatDate(org.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleImpersonate(org)}
                    className="flex-1"
                  >
                    <FiLogIn className="w-4 h-4 mr-1" />
                    Impersonate
                  </Button>
                  <Button
                    variant={org.isActive ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => {
                      setSelectedOrg(org);
                      setShowToggleDialog(true);
                    }}
                    className="flex-1"
                  >
                    {org.isActive ? <FiToggleRight className="w-4 h-4 mr-1" /> : <FiToggleLeft className="w-4 h-4 mr-1" />}
                    {org.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <EmptyState
              icon={FiBriefcase}
              title="No organizations found"
              description="No organizations match your search"
            />
          </Card>
        )}
      </div>

      {/* Toggle Status Dialog */}
      <ConfirmDialog
        isOpen={showToggleDialog}
        onClose={() => {
          setShowToggleDialog(false);
          setSelectedOrg(null);
        }}
        onConfirm={handleToggleStatus}
        title={`${selectedOrg?.isActive ? 'Disable' : 'Enable'} Organization?`}
        description={`Are you sure you want to ${
          selectedOrg?.isActive ? 'disable' : 'enable'
        } ${selectedOrg?.name}? ${
          selectedOrg?.isActive ? 'Users will not be able to access the platform.' : ''
        }`}
        confirmText={selectedOrg?.isActive ? 'Disable' : 'Enable'}
        variant={selectedOrg?.isActive ? 'danger' : 'primary'}
        isLoading={isToggling}
      />
      </div>
    </div>
  );
}
