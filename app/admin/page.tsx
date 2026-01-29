"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AddUserModal } from '@/components/modals/AddUserModal'
import { EditUserModal } from '@/components/modals/EditUserModal'
import { LookupModal } from '@/components/modals/LookupModal'

type AdminSection = 'users' | 'item-types' | 'locations' | 'analysts' | 'transfer-reasons'

interface User {
  id: number
  username: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

interface Lookup {
  id: number
  name?: string
  full_name?: string
  reason?: string
  category?: string
  analyst_id?: string
  can_delete?: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<AdminSection>('users')
  const [users, setUsers] = useState<User[]>([])
  const [lookups, setLookups] = useState<Lookup[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [showLookupModal, setShowLookupModal] = useState(false)
  const [lookupModalMode, setLookupModalMode] = useState<'add' | 'edit'>('add')
  const [editingLookupId, setEditingLookupId] = useState<number | null>(null)
  const [editingLookupData, setEditingLookupData] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [activeSection])

  async function loadData() {
    setLoading(true)
    try {
      if (activeSection === 'users') {
        const res = await fetch('/api/admin/users')
        const data = await res.json()
        setUsers(data.users || [])
      } else {
        const res = await fetch(`/api/lookups/${activeSection}`)
        const data = await res.json()
        setLookups(data[activeSection.replace('-', '_')] || data.analysts || data.reasons || [])
      }
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
  
  async function handleDeleteLookup(id: number) {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/admin/lookups/${activeSection}/${id}`, { method: 'DELETE' })
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
  
  function handleEditLookup(id: number) {
    const item = lookups.find(l => l.id === id)
    if (item) {
      setEditingLookupId(id)
      setEditingLookupData(item)
      setLookupModalMode('edit')
      setShowLookupModal(true)
    }
  }
  
  function handleAddClick() {
    if (activeSection === 'users') {
      setShowAddUserModal(true)
    } else {
      setLookupModalMode('add')
      setEditingLookupId(null)
      setEditingLookupData(null)
      setShowLookupModal(true)
    }
  }

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => router.push('/'))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </h1>
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
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">
                Admin Sections
              </h2>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveSection('users')}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
                    activeSection === 'users'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveSection('item-types')}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
                    activeSection === 'item-types'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Item Types
                </button>
                <button
                  onClick={() => setActiveSection('locations')}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
                    activeSection === 'locations'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Locations
                </button>
                <button
                  onClick={() => setActiveSection('analysts')}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
                    activeSection === 'analysts'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Analysts
                </button>
                <button
                  onClick={() => setActiveSection('transfer-reasons')}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
                    activeSection === 'transfer-reasons'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Transfer Reasons
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Section Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {activeSection.replace('-', ' ')}
                </h2>
                <Button onClick={handleAddClick}>
                  Add New
                </Button>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <p className="text-center text-gray-500 py-8">Loading...</p>
                ) : activeSection === 'users' ? (
                  <UsersTable users={users} onDelete={handleDeleteUser} onEdit={handleEditUser} />
                ) : (
                  <LookupsTable 
                    lookups={lookups} 
                    type={activeSection}
                    onDelete={handleDeleteLookup} 
                    onEdit={handleEditLookup} 
                  />
                )}
              </div>
            </div>
          </div>
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
      
      <LookupModal
        open={showLookupModal}
        onOpenChange={setShowLookupModal}
        onSuccess={loadData}
        type={activeSection as any}
        mode={lookupModalMode}
        editId={editingLookupId}
        editData={editingLookupData}
      />
    </div>
  )
}

function UsersTable({ users, onDelete, onEdit }: { users: User[], onDelete: (id: number) => void, onEdit: (id: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Username</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Full Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {users.map(user => (
            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm">{user.username}</td>
              <td className="px-4 py-3 text-sm">{user.full_name}</td>
              <td className="px-4 py-3 text-sm">{user.email}</td>
              <td className="px-4 py-3 text-sm">
                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(user.id)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(user.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LookupsTable({ lookups, type, onDelete, onEdit }: { lookups: Lookup[], type: string, onDelete: (id: number) => void, onEdit: (id: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {type === 'analysts' ? 'Analyst ID' : 'ID'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {type === 'analysts' ? 'Full Name' : type === 'transfer-reasons' ? 'Reason' : 'Name'}
            </th>
            {type === 'item-types' && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {lookups.map(item => (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm">{item.analyst_id || item.id}</td>
              <td className="px-4 py-3 text-sm">{item.full_name || item.name || item.reason}</td>
              {type === 'item-types' && (
                <td className="px-4 py-3 text-sm">{item.category}</td>
              )}
              <td className="px-4 py-3 text-sm space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(item.id)}>Edit</Button>
                {item.can_delete !== false && (
                  <Button variant="outline" size="sm" onClick={() => onDelete(item.id)}>Delete</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
