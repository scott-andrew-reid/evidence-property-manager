"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AddUserModal } from '@/components/modals/AddUserModal'
import { EditUserModal } from '@/components/modals/EditUserModal'

interface User {
  id: number
  username: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteUser(id: number) {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Delete failed')
      }
      
      await loadData()
    } catch (error: any) {
      alert(error.message)
    }
  }
  
  function handleEditUser(id: number) {
    setEditingUserId(id)
    setShowEditUserModal(true)
  }

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => router.push('/'))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">User Management</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg shadow border">
          {/* Section Header */}
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Users</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage system users and permissions
              </p>
            </div>
            <Button onClick={() => setShowAddUserModal(true)}>
              Add New User
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading users...</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <UsersTable users={users} onDelete={handleDeleteUser} onEdit={handleEditUser} />
            )}
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-6 bg-muted/50 rounded-lg border p-6">
          <h3 className="text-sm font-semibold mb-2">Additional Admin Features Coming Soon</h3>
          <p className="text-sm text-muted-foreground mb-3">
            The following sections will be available in Phase 2 of the enhancement plan:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong>Item Types</strong> - Manage evidence item categories (phones, hard drives, etc.)</li>
            <li><strong>Locations</strong> - Manage storage locations</li>
            <li><strong>Transfer Reasons</strong> - Manage standard transfer reasons</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Note: Analysts are managed through the Users section above.
          </p>
        </div>
      </div>
      
      {/* Modals */}
      <AddUserModal
        open={showAddUserModal}
        onOpenChange={setShowAddUserModal}
        onSuccess={loadData}
      />
      
      <EditUserModal
        open={showEditUserModal}
        onOpenChange={setShowEditUserModal}
        onSuccess={loadData}
        userId={editingUserId}
        users={users}
      />
    </div>
  )
}

function UsersTable({ users, onDelete, onEdit }: { users: User[], onDelete: (id: number) => void, onEdit: (id: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Username
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Full Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {users.map(user => (
            <tr key={user.id} className="hover:bg-muted/50">
              <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
              <td className="px-4 py-3 text-sm">{user.full_name}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{user.email || '-'}</td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(user.id)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(user.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
