'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';

export default function AdminNew() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Users
  const [users, setUsers] = useState<any[]>([]);
  
  // Lookups
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [transferReasons, setTransferReasons] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, typesRes, locsRes, reasonsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/lookups/item-types'),
        fetch('/api/lookups/locations'),
        fetch('/api/lookups/transfer-reasons')
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (typesRes.ok) {
        const data = await typesRes.json();
        setItemTypes(data.item_types || []);
      }

      if (locsRes.ok) {
        const data = await locsRes.json();
        setLocations(data.locations || []);
      }

      if (reasonsRes.ok) {
        const data = await reasonsRes.json();
        setTransferReasons(data.transfer_reasons || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleDeleteItemType = async (id: number) => {
    if (!confirm('Delete this item type?')) return;
    
    try {
      const res = await fetch(`/api/lookups/item-types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAllData();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (err) {
      console.error('Failed to delete item type:', err);
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Delete this location?')) return;
    
    try {
      const res = await fetch(`/api/lookups/locations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAllData();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (err) {
      console.error('Failed to delete location:', err);
    }
  };

  const handleDeleteReason = async (id: number) => {
    if (!confirm('Delete this transfer reason?')) return;
    
    try {
      const res = await fetch(`/api/lookups/transfer-reasons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAllData();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (err) {
      console.error('Failed to delete transfer reason:', err);
    }
  };

  const userColumns = [
    { key: 'username', label: 'Username', sortable: true },
    { key: 'full_name', label: 'Full Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    {
      key: 'is_active',
      label: 'Active',
      render: (user: any) => (
        <span className={`px-2 py-1 rounded text-xs ${
          user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {user.is_active ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: any) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); alert('Edit user not implemented in this demo'); }}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const itemTypeColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'extended_fields',
      label: 'Extended Fields',
      render: (type: any) => (
        type.extended_fields?.fields?.length || 0
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (type: any) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); alert('Edit not implemented in this demo'); }}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteItemType(type.id); }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const locationColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'building', label: 'Building', sortable: true },
    { key: 'room', label: 'Room', sortable: true },
    { key: 'capacity', label: 'Capacity', sortable: true },
    { key: 'current_count', label: 'Current', sortable: true },
    {
      key: 'active',
      label: 'Active',
      render: (loc: any) => (
        <span className={`px-2 py-1 rounded text-xs ${
          loc.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {loc.active ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (loc: any) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); alert('Edit not implemented in this demo'); }}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc.id); }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const reasonColumns = [
    { key: 'reason', label: 'Reason', sortable: true },
    {
      key: 'requires_approval',
      label: 'Requires Approval',
      render: (reason: any) => (
        <span className={`px-2 py-1 rounded text-xs ${
          reason.requires_approval ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {reason.requires_approval ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (reason: any) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); alert('Edit not implemented in this demo'); }}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteReason(reason.id); }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard-new')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  System Configuration & Management
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={loadAllData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          tabs={[
            {
              id: 'users',
              label: `Users (${users.length})`,
              content: (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">User Management</h2>
                    <button
                      onClick={() => alert('Add user not implemented in this demo')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add User
                    </button>
                  </div>
                  <DataTable
                    data={users}
                    columns={userColumns}
                    searchKeys={['username', 'full_name', 'email']}
                    searchPlaceholder="Search users..."
                    loading={loading}
                  />
                </div>
              )
            },
            {
              id: 'item-types',
              label: `Item Types (${itemTypes.length})`,
              content: (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Item Type Management</h2>
                    <button
                      onClick={() => alert('Add item type not implemented in this demo')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item Type
                    </button>
                  </div>
                  <DataTable
                    data={itemTypes}
                    columns={itemTypeColumns}
                    searchKeys={['name', 'category']}
                    searchPlaceholder="Search item types..."
                    loading={loading}
                  />
                </div>
              )
            },
            {
              id: 'locations',
              label: `Locations (${locations.length})`,
              content: (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Location Management</h2>
                    <button
                      onClick={() => alert('Add location not implemented in this demo')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Location
                    </button>
                  </div>
                  <DataTable
                    data={locations}
                    columns={locationColumns}
                    searchKeys={['name', 'building', 'room']}
                    searchPlaceholder="Search locations..."
                    loading={loading}
                  />
                </div>
              )
            },
            {
              id: 'transfer-reasons',
              label: `Transfer Reasons (${transferReasons.length})`,
              content: (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Transfer Reason Management</h2>
                    <button
                      onClick={() => alert('Add transfer reason not implemented in this demo')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Reason
                    </button>
                  </div>
                  <DataTable
                    data={transferReasons}
                    columns={reasonColumns}
                    searchKeys={['reason']}
                    searchPlaceholder="Search transfer reasons..."
                    loading={loading}
                  />
                </div>
              )
            }
          ]}
        />
      </main>
    </div>
  );
}
