"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TransferWizard } from '@/components/modals/TransferWizard'

interface EvidenceItem {
  id: number
  case_number: string
  item_number: string
  description: string
  item_type_name: string
  current_status: string
  current_location_name: string
  current_custodian_name: string
  collected_date: string
  created_at: string
}

interface ItemType {
  id: number
  name: string
}

interface Location {
  id: number
  name: string
}

interface Analyst {
  id: number
  full_name: string
}

export default function DashboardV2() {
  const router = useRouter()
  const [items, setItems] = useState<EvidenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransferWizard, setShowTransferWizard] = useState(false)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCase, setFilterCase] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterType, setFilterType] = useState('')
  
  // Lookups for filters
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [statuses] = useState(['stored', 'in_analysis', 'in_court', 'disposed', 'destroyed'])
  
  // Load lookups
  useEffect(() => {
    loadLookups()
  }, [])
  
  // Load evidence on mount and when filters change
  useEffect(() => {
    loadEvidence()
  }, [searchQuery, filterCase, filterStatus, filterLocation, filterType])

  async function loadLookups() {
    try {
      const [typesRes, locsRes] = await Promise.all([
        fetch('/api/lookups/item-types'),
        fetch('/api/lookups/locations')
      ])
      
      const typesData = await typesRes.json()
      const locsData = await locsRes.json()
      
      setItemTypes(typesData.itemTypes || [])
      setLocations(locsData.locations || [])
    } catch (error) {
      console.error('Failed to load lookups:', error)
    }
  }

  async function loadEvidence() {
    try {
      setLoading(true)
      
      // Build query params
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filterCase) params.append('case', filterCase)
      if (filterStatus) params.append('status', filterStatus)
      if (filterLocation) params.append('location', filterLocation)
      if (filterType) params.append('type', filterType)
      
      const response = await fetch(`/api/evidence-v2?${params.toString()}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch evidence')
      }
      
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error loading evidence:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }
  
  function clearFilters() {
    setSearchQuery('')
    setFilterCase('')
    setFilterStatus('')
    setFilterLocation('')
    setFilterType('')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Evidence Property Manager
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Chain of Custody System v2.0
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Evidence Items
          </h2>
          <Button onClick={() => setShowTransferWizard(true)} className="w-full sm:w-auto">
            + New Transfer
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="xl:col-span-2">
              <Input
                type="search"
                placeholder="Search case, item, description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Case Filter */}
            <div>
              <Input
                type="text"
                placeholder="Filter by case..."
                value={filterCase}
                onChange={e => setFilterCase(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={filterLocation}
                onChange={e => setFilterLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">All Types</option>
                {itemTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Clear Filters */}
          {(searchQuery || filterCase || filterStatus || filterLocation || filterType) && (
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {loading ? 'Loading...' : `${items.length} item${items.length !== 1 ? 's' : ''} found`}
        </div>

        {/* Evidence Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Case #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Item #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                    Custodian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Loading evidence items...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No evidence items found. Add your first item to get started.
                    </td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.case_number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.item_number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                        {item.item_type_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm hidden lg:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.current_status === 'stored' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          item.current_status === 'in_analysis' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          item.current_status === 'in_court' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {item.current_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden xl:table-cell">
                        {item.current_location_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden xl:table-cell">
                        {item.current_custodian_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Transfer Wizard */}
      <TransferWizard
        open={showTransferWizard}
        onOpenChange={setShowTransferWizard}
        onSuccess={loadEvidence}
      />
    </div>
  )
}
