"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface User {
  id: number
  username: string
  full_name: string
  email: string | null
  role: string
  is_active: boolean
}

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  userId: number | null
  users: User[]
}

export function EditUserModal({ open, onOpenChange, onSuccess, userId, users }: EditUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'analyst',
    is_active: true,
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (userId && users) {
      const user = users.find(u => u.id === userId)
      if (user) {
        setFormData({
          full_name: user.full_name,
          email: user.email || '',
          role: user.role,
          is_active: user.is_active,
          password: ''
        })
      }
    }
  }, [userId, users])

  function validateForm() {
    const newErrors: Record<string, string> = {}
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm() || !userId) return
    
    setLoading(true)
    try {
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email || null,
        role: formData.role,
        is_active: formData.is_active
      }
      
      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password
      }
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }
      
      setErrors({})
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const user = users.find(u => u.id === userId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User: {user?.username}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
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
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={formData.role}
              onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4"
            />
            <Label htmlFor="is_active" className="cursor-pointer">Active User</Label>
          </div>
          
          <div>
            <Label htmlFor="password">New Password (leave blank to keep current)</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter new password"
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
