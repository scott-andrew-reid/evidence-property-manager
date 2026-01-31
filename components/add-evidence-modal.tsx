'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from './ui/modal';
import { AlertCircle, Plus } from 'lucide-react';

interface AddEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddEvidenceModal({ isOpen, onClose, onSuccess }: AddEvidenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    case_number: '',
    item_number: '',
    description: '',
    item_type_id: null as number | null,
    collected_date: new Date().toISOString().split('T')[0],
    collected_by: '',
    collection_location: '',
    current_location_id: null as number | null,
    current_custodian_id: null as number | null,
    current_status: 'stored',
    notes: '',
    extended_fields: {} as Record<string, any>
  });

  const [selectedItemType, setSelectedItemType] = useState<any | null>(null);

  // Load lookups when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLookups();
    }
  }, [isOpen]);

  // Update extended fields when item type changes
  useEffect(() => {
    if (formData.item_type_id) {
      const itemType = itemTypes.find(t => t.id === formData.item_type_id);
      setSelectedItemType(itemType);
      
      // Initialize extended fields
      if (itemType?.extended_fields?.fields) {
        const fields: Record<string, any> = {};
        itemType.extended_fields.fields.forEach((field: string) => {
          fields[field] = '';
        });
        setFormData(prev => ({ ...prev, extended_fields: fields }));
      } else {
        setFormData(prev => ({ ...prev, extended_fields: {} }));
      }
    } else {
      setSelectedItemType(null);
      setFormData(prev => ({ ...prev, extended_fields: {} }));
    }
  }, [formData.item_type_id, itemTypes]);

  const fetchLookups = async () => {
    try {
      const [typesRes, locsRes, usersRes] = await Promise.all([
        fetch('/api/lookups/item-types'),
        fetch('/api/lookups/locations'),
        fetch('/api/admin/users')
      ]);

      if (typesRes.ok) {
        const data = await typesRes.json();
        setItemTypes(data.item_types || []);
      }

      if (locsRes.ok) {
        const data = await locsRes.json();
        setLocations(data.locations || []);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch lookups:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/evidence-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create evidence item');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      case_number: '',
      item_number: '',
      description: '',
      item_type_id: null,
      collected_date: new Date().toISOString().split('T')[0],
      collected_by: '',
      collection_location: '',
      current_location_id: null,
      current_custodian_id: null,
      current_status: 'stored',
      notes: '',
      extended_fields: {}
    });
    setError(null);
    setSelectedItemType(null);
  };

  const updateExtendedField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      extended_fields: {
        ...prev.extended_fields,
        [field]: value
      }
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Evidence Item" size="lg">
      <form onSubmit={handleSubmit}>
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Case Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.case_number}
                onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="e.g., 2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Item Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.item_number}
                onChange={(e) => setFormData({ ...formData, item_number: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="e.g., E-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              placeholder="Detailed description of the evidence item..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Item Type</label>
            <select
              value={formData.item_type_id || ''}
              onChange={(e) => setFormData({ ...formData, item_type_id: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
            >
              <option value="">Select type...</option>
              {itemTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} {type.category && `(${type.category})`}
                </option>
              ))}
            </select>
          </div>

          {/* Extended Fields (Type-specific) */}
          {selectedItemType?.extended_fields?.fields && selectedItemType.extended_fields.fields.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Type-Specific Fields ({selectedItemType.name})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedItemType.extended_fields.fields.map((field: string) => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1 capitalize">
                      {field.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={formData.extended_fields[field] || ''}
                      onChange={(e) => updateExtendedField(field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-sm"
                      placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collection Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Collected Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.collected_date}
                onChange={(e) => setFormData({ ...formData, collected_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Collected By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.collected_by}
                onChange={(e) => setFormData({ ...formData, collected_by: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="Officer name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Collection Location</label>
            <input
              type="text"
              value={formData.collection_location}
              onChange={(e) => setFormData({ ...formData, collection_location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              placeholder="Where the evidence was collected"
            />
          </div>

          {/* Current Status & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Location</label>
              <select
                value={formData.current_location_id || ''}
                onChange={(e) => setFormData({ ...formData, current_location_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              >
                <option value="">Select location...</option>
                {locations.filter(l => l.active).map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Current Custodian</label>
              <select
                value={formData.current_custodian_id || ''}
                onChange={(e) => setFormData({ ...formData, current_custodian_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              >
                <option value="">Select custodian...</option>
                {users.filter(u => u.is_active).map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              placeholder="Additional notes about this evidence..."
            />
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Evidence
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
