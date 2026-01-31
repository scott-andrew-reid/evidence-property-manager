'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, RefreshCw, Filter, FileText } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { AddEvidenceModal } from '@/components/add-evidence-modal';
import { EvidenceDetailsModal } from '@/components/evidence-details-modal';
import { TransferWizard } from '@/components/transfer-wizard';

export default function DashboardNew() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTransferWizard, setShowTransferWizard] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Lookups
  const [locations, setLocations] = useState<any[]>([]);
  const [itemTypes, setItemTypes] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadLookups();
  }, [filterStatus, filterLocation, filterType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterLocation) params.append('location', filterLocation);
      if (filterType) params.append('type', filterType);
      
      const response = await fetch(`/api/evidence-v2?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [locsRes, typesRes] = await Promise.all([
        fetch('/api/lookups/locations'),
        fetch('/api/lookups/item-types')
      ]);

      if (locsRes.ok) {
        const data = await locsRes.json();
        setLocations(data.locations || []);
      }

      if (typesRes.ok) {
        const data = await typesRes.json();
        setItemTypes(data.item_types || []);
      }
    } catch (err) {
      console.error('Failed to load lookups:', err);
    }
  };

  const handleRowClick = (item: any) => {
    setSelectedItemId(item.id);
    setShowDetailsModal(true);
  };

  const handleTransfer = (item: any) => {
    setSelectedItem(item);
    setShowTransferWizard(true);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const columns = [
    {
      key: 'case_number',
      label: 'Case #',
      sortable: true,
      width: '120px'
    },
    {
      key: 'item_number',
      label: 'Item #',
      sortable: true,
      width: '120px'
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true
    },
    {
      key: 'item_type_name',
      label: 'Type',
      sortable: true,
      width: '150px'
    },
    {
      key: 'current_status',
      label: 'Status',
      sortable: true,
      width: '120px',
      render: (item: any) => <StatusBadge status={item.current_status} />
    },
    {
      key: 'current_location_name',
      label: 'Location',
      sortable: true,
      width: '180px',
      render: (item: any) => item.current_location_name || '—'
    },
    {
      key: 'current_custodian_name',
      label: 'Custodian',
      sortable: true,
      width: '150px',
      render: (item: any) => item.current_custodian_name || '—'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Evidence Property Manager
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chain of Custody Tracking System
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Admin
              </button>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Evidence
            </button>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            
            <button
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Reports
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {items.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">
              {items.filter(i => i.current_status === 'stored').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">In Storage</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600">
              {items.filter(i => i.current_status === 'in_analysis').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">In Analysis</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600">
              {items.filter(i => i.current_status === 'in_court').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">In Court</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <DataTable
            data={items}
            columns={columns}
            searchKeys={['case_number', 'item_number', 'description']}
            searchPlaceholder="Search by case, item, or description..."
            onRowClick={handleRowClick}
            loading={loading}
            emptyMessage="No evidence items found"
            filters={
              <>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm"
                >
                  <option value="">All Status</option>
                  <option value="stored">Stored</option>
                  <option value="in_analysis">In Analysis</option>
                  <option value="in_court">In Court</option>
                  <option value="released">Released</option>
                  <option value="disposed">Disposed</option>
                </select>

                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm"
                >
                  <option value="">All Locations</option>
                  {locations.filter(l => l.active).map(location => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm"
                >
                  <option value="">All Types</option>
                  {itemTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </>
            }
          />
        </div>
      </main>

      {/* Modals */}
      <AddEvidenceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadData();
          setShowAddModal(false);
        }}
      />

      <EvidenceDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedItemId(null);
        }}
        evidenceId={selectedItemId}
      />

      <TransferWizard
        isOpen={showTransferWizard}
        onClose={() => {
          setShowTransferWizard(false);
          setSelectedItem(null);
        }}
        evidenceItem={selectedItem}
        onComplete={() => {
          loadData();
          setShowTransferWizard(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
}
