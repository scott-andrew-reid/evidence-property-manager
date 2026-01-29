"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'

interface AddEvidenceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ItemType {
  id: number
  name: string
  category: string
  extended_fields: { fields: string[] }
}

interface Location {
  id: number
  name: string
  location_type: string
}

interface Analyst {
  id: number
  full_name: string
  badge_number: string
}

export function AddEvidenceModal({ open, onOpenChange, onSuccess }: AddEvidenceModalProps) {
  const [loading, setLoading] = useState(false)
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [analysts, setAnalysts] = useState<Analyst[]>([])
  
  const [formData, setFormData] = useState({
    case_number: '',
    item_number: '',
    item_type_id: '',
    description: '',
    collected_date: new Date().toISOString().split('T')[0],
    collected_by: '',
    collection_location: '',
    current_location_id: '',
    current_custodian_id: '',
    serial_number: '',
    make_model: '',
    barcode: '',
    condition_notes: '',
    extended_details: {} as Record<string, string>
  })
  
  const [selectedType, setSelectedType] = useState<ItemType | null>(null)

  // Load lookups
  useEffect(() => {
    if (open) {
      loadLookups()
    }
  }, [open])

  async function loadLookups() {
    try {
      const [typesRes, locsRes, analystsRes] = await Promise.all([
        fetch('/api/lookups/item-types'),
        fetch('/api/lookups/locations'),
        fetch('/api/lookups/analysts')
      ])
      
      const typesData = await typesRes.json()
      const locsData = await locsRes.json()
      const analystsData = await analystsRes.json()
      
      setItemTypes(typesData.itemTypes || [])
      setLocations(locsData.locations || [])
      setAnalysts(analystsData.analysts || [])
    } catch (error) {
      console.error('Failed to load lookups:', error)
    }
  }

  function handleTypeChange(typeId: string) {
    const type = itemTypes.find(t => t.id === parseInt(typeId))
    setSelectedType(type || null)
    setFormData(prev => ({ ...prev, item_type_id: typeId, extended_details: {} }))
  }

  function handleExtendedFieldChange(field: string, value: string) {
    setFormData(prev => ({
      ...prev,
      extended_details: { ...prev.extended_details, [field]: value }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/evidence-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          item_type_id: formData.item_type_id ? parseInt(formData.item_type_id) : null,
          current_location_id: formData.current_location_id ? parseInt(formData.current_location_id) : null,
          current_custodian_id: formData.current_custodian_id ? parseInt(formData.current_custodian_id) : null,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create evidence')
      }

      // Reset form
      setFormData({
        case_number: '',
        item_number: '',
        item_type_id: '',
        description: '',
        collected_date: new Date().toISOString().split('T')[0],
        collected_by: '',
        collection_location: '',
        current_location_id: '',
        current_custodian_id: '',
        serial_number: '',
        make_model: '',
        barcode: '',
        condition_notes: '',
        extended_details: {}
      })
      setSelectedType(null)
      
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Evidence Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Case Number */}
            <div>
              <Label htmlFor="case_number">Case Number *</Label>
              <Input
                id="case_number"
                value={formData.case_number}
                onChange={e => setFormData(prev => ({ ...prev, case_number: e.target.value }))}
                required
              />
            </div>

            {/* Item Number */}
            <div>
              <Label htmlFor="item_number">Item Number *</Label>
              <Input
                id="item_number"
                value={formData.item_number}
                onChange={e => setFormData(prev => ({ ...prev, item_number: e.target.value }))}
                required
              />
            </div>

            {/* Item Type */}
            <div>
              <Label htmlFor="item_type_id">Item Type</Label>
              <select
                id="item_type_id"
                value={formData.item_type_id}
                onChange={e => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select type...</option>
                {itemTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Collected Date */}
            <div>
              <Label htmlFor="collected_date">Collected Date *</Label>
              <Input
                id="collected_date"
                type="date"
                value={formData.collected_date}
                onChange={e => setFormData(prev => ({ ...prev, collected_date: e.target.value }))}
                required
              />
            </div>

            {/* Collected By */}
            <div>
              <Label htmlFor="collected_by">Collected By *</Label>
              <Input
                id="collected_by"
                value={formData.collected_by}
                onChange={e => setFormData(prev => ({ ...prev, collected_by: e.target.value }))}
                required
              />
            </div>

            {/* Collection Location */}
            <div>
              <Label htmlFor="collection_location">Collection Location</Label>
              <Input
                id="collection_location"
                value={formData.collection_location}
                onChange={e => setFormData(prev => ({ ...prev, collection_location: e.target.value }))}
              />
            </div>

            {/* Current Location */}
            <div>
              <Label htmlFor="current_location_id">Current Location</Label>
              <select
                id="current_location_id"
                value={formData.current_location_id}
                onChange={e => setFormData(prev => ({ ...prev, current_location_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.location_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Custodian */}
            <div>
              <Label htmlFor="current_custodian_id">Current Custodian</Label>
              <select
                id="current_custodian_id"
                value={formData.current_custodian_id}
                onChange={e => setFormData(prev => ({ ...prev, current_custodian_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select custodian...</option>
                {analysts.map(analyst => (
                  <option key={analyst.id} value={analyst.id}>
                    {analyst.full_name} ({analyst.badge_number})
                  </option>
                ))}
              </select>
            </div>

            {/* Serial Number */}
            <div>
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={e => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
              />
            </div>

            {/* Make/Model */}
            <div>
              <Label htmlFor="make_model">Make/Model</Label>
              <Input
                id="make_model"
                value={formData.make_model}
                onChange={e => setFormData(prev => ({ ...prev, make_model: e.target.value }))}
              />
            </div>

            {/* Barcode */}
            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={e => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
            />
          </div>

          {/* Type-Specific Extended Fields */}
          {selectedType && selectedType.extended_fields?.fields?.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">Type-Specific Details ({selectedType.name})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedType.extended_fields.fields.map((field: string) => (
                  <div key={field}>
                    <Label htmlFor={`ext_${field}`}>{field}</Label>
                    <Input
                      id={`ext_${field}`}
                      value={formData.extended_details[field] || ''}
                      onChange={e => handleExtendedFieldChange(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Condition Notes */}
          <div>
            <Label htmlFor="condition_notes">Condition Notes</Label>
            <Textarea
              id="condition_notes"
              value={formData.condition_notes}
              onChange={e => setFormData(prev => ({ ...prev, condition_notes: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Evidence'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
