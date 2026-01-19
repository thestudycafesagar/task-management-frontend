'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import SuperAdminNavbar from '@/components/SuperAdminNavbar';
import { TableSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
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
    <div className="min-h-screen bg-gray-50">
      <SuperAdminNavbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizations</h1>
          <p className="text-gray-600">Manage all organizations on the platform</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
            />
          </div>
        </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : orgsData && orgsData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orgsData.map((org) => (
                  <tr key={org._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{org.name}</div>
                        <div className="text-sm text-gray-500">/{org.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {org.adminCount} admins, {org.employeeCount} employees
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(org.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          org.isActive
                            ? 'bg-green-50 text-green-600 border-green-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                      >
                        {org.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleImpersonate(org)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-colors"
                          title="Login as Company"
                        >
                          <FiLogIn className="w-4 h-4" />
                          Impersonate
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrg(org);
                            setShowToggleDialog(true);
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            org.isActive
                              ? 'text-red-600 border-red-600 hover:bg-red-600 hover:text-white'
                              : 'text-green-600 border-green-600 hover:bg-green-600 hover:text-white'
                          }`}
                          title={org.isActive ? 'Disable' : 'Enable'}
                        >
                          {org.isActive ? (
                            <>
                              <FiToggleRight className="w-4 h-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <FiToggleLeft className="w-4 h-4" />
                              Enable
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={FiBriefcase}
              title="No organizations found"
              description="Organizations will appear here once companies sign up"
            />
          </div>
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
