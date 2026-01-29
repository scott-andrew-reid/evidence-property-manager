"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LookupType = 'item-types' | 'locations' | 'analysts' | 'transfer-reasons'

interface LookupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  type: LookupType
  mode: 'add' | 'edit'
  editId?: number | null
  editData?: any
}

export function LookupModal({ open, onOpenChange, onSuccess, type, mode, editId, editData }: LookupModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode === 'edit' && editData) {
      setFormData({ ...editData })
    } else {
      // Reset for add mode
      setFormData(getInitialFormData(type))
    }
  }, [mode, editData, type, open])

  function getInitialFormData(type: LookupType): Record<string, string> {
    switch (type) {
      case 'item-types':
        return { name: '', category: '' }
      case 'locations':
        return { name: '' }
      case 'analysts':
        return { analyst_id: '', full_name: '', email: '' }
      case 'transfer-reasons':
        return { reason: '' }
    }
  }

  function getTitle(): string {
    const typeNames = {
      'item-types': 'Item Type',
      'locations': 'Location',
      'analysts': 'Analyst',
      'transfer-reasons': 'Transfer Reason'
    }
    return `${mode === 'add' ? 'Add' : 'Edit'} ${typeNames[type]}`
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}
    
    switch (type) {
      case 'item-types':
        if (!formData.name?.trim()) {
          newErrors.name = 'Name is required'
        }
        break
      case 'locations':
        if (!formData.name?.trim()) {
          newErrors.name = 'Name is required'
        }
        break
      case 'analysts':
        if (!formData.analyst_id?.trim()) {
          newErrors.analyst_id = 'Analyst ID is required'
        }
        if (!formData.full_name?.trim()) {
          newErrors.full_name = 'Full name is required'
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Invalid email format'
        }
        break
      case 'transfer-reasons':
        if (!formData.reason?.trim()) {
          newErrors.reason = 'Reason is required'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const url = mode === 'add' 
        ? `/api/admin/lookups/${type}`
        : `/api/admin/lookups/${type}/${editId}`
      
      const response = await fetch(url, {
        method: mode === 'add' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${mode} ${type}`)
      }
      
      setErrors({})
      setFormData(getInitialFormData(type))
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Types */}
          {type === 'item-types' && (
            <>
              <div>
                <Label htmlFor="name">Type Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Mobile Phone, Laptop, Hard Drive"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  value={formData.category || ''}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Digital, Physical, Documents"
                />
              </div>
            </>
          )}
          
          {/* Locations */}
          {type === 'locations' && (
            <div>
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Evidence Room A, Secure Storage 1"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
          )}
          
          {/* Analysts */}
          {type === 'analysts' && (
            <>
              <div>
                <Label htmlFor="analyst_id">Analyst ID *</Label>
                <Input
                  id="analyst_id"
                  value={formData.analyst_id || ''}
                  onChange={e => setFormData(prev => ({ ...prev, analyst_id: e.target.value }))}
                  placeholder="e.g., ANALYST001, SR001"
                  className={errors.analyst_id ? 'border-red-500' : ''}
                  disabled={mode === 'edit'}
                />
                {errors.analyst_id && (
                  <p className="text-sm text-red-500 mt-1">{errors.analyst_id}</p>
                )}
                {mode === 'edit' && (
                  <p className="text-xs text-gray-500 mt-1">Analyst ID cannot be changed</p>
                )}
              </div>
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter full name"
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            </>
          )}
          
          {/* Transfer Reasons */}
          {type === 'transfer-reasons' && (
            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                value={formData.reason || ''}
                onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Initial Receipt, Transfer to Lab, Return to Custodian"
                className={errors.reason ? 'border-red-500' : ''}
              />
              {errors.reason && (
                <p className="text-sm text-red-500 mt-1">{errors.reason}</p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (mode === 'add' ? 'Creating...' : 'Updating...') : (mode === 'add' ? 'Create' : 'Update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
