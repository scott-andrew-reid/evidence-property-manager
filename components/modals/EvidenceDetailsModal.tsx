"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface EvidenceDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: number | null
}

interface EvidenceItem {
  id: number
  case_number: string
  item_number: string
  description: string
  item_type_name: string
  item_type_category: string
  current_status: string
  current_location_name: string
  current_custodian_name: string
  collected_date: string
  collected_by: string
  collection_location: string
  serial_number: string
  make_model: string
  barcode: string
  condition_notes: string
  extended_details: Record<string, any>
  images: string[]
  created_at: string
}

interface Note {
  id: number
  text: string
  created_by: string
  created_at: string
}

interface Photo {
  id: number
  photo_data: string
  caption: string | null
  uploaded_by_name: string
  uploaded_at: string
}

export function EvidenceDetailsModal({ open, onOpenChange, itemId }: EvidenceDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [item, setItem] = useState<EvidenceItem | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'photos' | 'history'>('details')
  
  useEffect(() => {
    if (open && itemId) {
      loadItemDetails()
    }
  }, [open, itemId])
  
  async function loadItemDetails() {
    if (!itemId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/evidence-v2/${itemId}`)
      if (!response.ok) throw new Error('Failed to load item')
      
      const data = await response.json()
      setItem(data.item)
      setNotes(data.notes || [])
      
      // Load photos
      const photosResponse = await fetch(`/api/evidence-v2/${itemId}/photos`)
      if (photosResponse.ok) {
        const photosData = await photosResponse.json()
        setPhotos(photosData.photos || [])
      }
    } catch (error) {
      console.error('Failed to load evidence details:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleAddNote() {
    if (!newNote.trim() || !itemId) return
    
    try {
      const response = await fetch(`/api/evidence-v2/${itemId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNote })
      })
      
      if (!response.ok) throw new Error('Failed to add note')
      
      const data = await response.json()
      setNotes(prev => [data.note, ...prev])
      setNewNote('')
    } catch (error: any) {
      alert(error.message)
    }
  }
  
  async function handlePhotoUpload(file: File) {
    if (!itemId) return
    
    setUploadingPhoto(true)
    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        
        const response = await fetch(`/api/evidence-v2/${itemId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_data: base64, caption: file.name })
        })
        
        if (!response.ok) throw new Error('Failed to upload photo')
        
        const data = await response.json()
        setPhotos(prev => [data.photo, ...prev])
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploadingPhoto(false)
    }
  }
  
  async function handleCapturePhoto() {
    if (!itemId) return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      
      // Wait for video to be ready
      await new Promise(resolve => video.onloadedmetadata = resolve)
      
      // Capture frame
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      
      // Stop stream
      stream.getTracks().forEach(track => track.stop())
      
      // Get data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      
      // Upload
      setUploadingPhoto(true)
      const response = await fetch(`/api/evidence-v2/${itemId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_data: dataUrl, caption: 'Captured photo' })
      })
      
      if (!response.ok) throw new Error('Failed to upload photo')
      
      const data = await response.json()
      setPhotos(prev => [data.photo, ...prev])
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploadingPhoto(false)
    }
  }
  
  async function handleDeletePhoto(photoId: number) {
    if (!confirm('Delete this photo?')) return
    
    try {
      const response = await fetch(`/api/evidence-v2/${itemId}/photos?photoId=${photoId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete photo')
      
      setPhotos(prev => prev.filter(p => p.id !== photoId))
    } catch (error: any) {
      alert(error.message)
    }
  }
  
  if (!item && !loading) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Evidence Details: {item?.case_number} / {item?.item_number}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : item ? (
          <>
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'details'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Notes ({notes.length})
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'photos'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Photos ({photos.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                History
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Case Number</Label>
                        <p className="text-sm font-medium">{item.case_number}</p>
                      </div>
                      <div>
                        <Label>Item Number</Label>
                        <p className="text-sm font-medium">{item.item_number}</p>
                      </div>
                      <div>
                        <Label>Type</Label>
                        <p className="text-sm">{item.item_type_name}</p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.current_status === 'stored' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {item.current_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <p className="text-sm">{item.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Collection Details */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Collection Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Collected Date</Label>
                        <p className="text-sm">{new Date(item.collected_date).toLocaleString()}</p>
                      </div>
                      <div>
                        <Label>Collected By</Label>
                        <p className="text-sm">{item.collected_by}</p>
                      </div>
                      {item.collection_location && (
                        <div className="col-span-2">
                          <Label>Collection Location</Label>
                          <p className="text-sm">{item.collection_location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Current Status */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Current Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Location</Label>
                        <p className="text-sm">{item.current_location_name || 'N/A'}</p>
                      </div>
                      <div>
                        <Label>Custodian</Label>
                        <p className="text-sm">{item.current_custodian_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Physical Details */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Physical Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {item.serial_number && (
                        <div>
                          <Label>Serial Number</Label>
                          <p className="text-sm font-mono">{item.serial_number}</p>
                        </div>
                      )}
                      {item.make_model && (
                        <div>
                          <Label>Make/Model</Label>
                          <p className="text-sm">{item.make_model}</p>
                        </div>
                      )}
                      {item.barcode && (
                        <div>
                          <Label>Barcode</Label>
                          <p className="text-sm font-mono">{item.barcode}</p>
                        </div>
                      )}
                      {item.condition_notes && (
                        <div className="col-span-2">
                          <Label>Condition Notes</Label>
                          <p className="text-sm">{item.condition_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Type-Specific Fields */}
                  {item.extended_details && Object.keys(item.extended_details).length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-3">
                        {item.item_type_name} Specific Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(item.extended_details).map(([key, value]) => (
                          <div key={key}>
                            <Label>{key}</Label>
                            <p className="text-sm">{value as string || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_note">Add Note</Label>
                    <Textarea
                      id="new_note"
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      rows={3}
                      placeholder="Enter note..."
                    />
                    <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                      Add Note
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4 space-y-3">
                    {notes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No notes yet. Add your first note above.
                      </p>
                    ) : (
                      notes.map(note => (
                        <div key={note.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {note.created_by} • {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <label htmlFor="photo-upload">
                      <Button variant="outline" asChild disabled={uploadingPhoto}>
                        <span>
                          {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                        </span>
                      </Button>
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handlePhotoUpload(file)
                      }}
                    />
                    <Button variant="outline" onClick={handleCapturePhoto} disabled={uploadingPhoto}>
                      Capture Photo
                    </Button>
                  </div>
                  
                  {photos.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-8">
                      No photos yet. Upload or capture a photo to get started.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map(photo => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.photo_data}
                            alt={photo.caption || 'Evidence photo'}
                            className="w-full h-48 object-cover rounded border"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(photo.photo_data)}
                            >
                              View Full
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePhoto(photo.id)}
                            >
                              Delete
                            </Button>
                          </div>
                          {photo.caption && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                              {photo.caption}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {photo.uploaded_by_name} • {new Date(photo.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="text-sm text-gray-500 text-center py-8">
                  Chain of custody history will be displayed here
                </div>
              )}
            </div>
          </>
        ) : null}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
