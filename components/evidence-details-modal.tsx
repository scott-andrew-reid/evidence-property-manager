'use client';

import { useState, useEffect } from 'react';
import { Modal } from './ui/modal';
import { Tabs } from './ui/tabs';
import { StatusBadge } from './ui/status-badge';
import { Skeleton } from './ui/skeleton';
import { Clock, MapPin, User, FileText, Image as ImageIcon, GitBranch, Plus } from 'lucide-react';

interface EvidenceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceId: number | null;
}

export function EvidenceDetailsModal({ isOpen, onClose, evidenceId }: EvidenceDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [evidence, setEvidence] = useState<any | null>(null);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (isOpen && evidenceId) {
      fetchDetails();
    }
  }, [isOpen, evidenceId]);

  const fetchDetails = async () => {
    if (!evidenceId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/evidence-v2/${evidenceId}`);
      if (response.ok) {
        const data = await response.json();
        setEvidence(data.item);
        setTransfers(data.transfers || []);
        setNotes(data.notes || []);
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Failed to fetch evidence details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !evidenceId) return;

    setAddingNote(true);
    try {
      const response = await fetch(`/api/evidence-v2/${evidenceId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote })
      });

      if (response.ok) {
        setNewNote('');
        fetchDetails(); // Refresh
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen || !evidenceId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={loading ? 'Loading...' : `Evidence Details`} size="xl">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : evidence ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {evidence.case_number}-{evidence.item_number}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{evidence.description}</p>
            </div>
            <StatusBadge status={evidence.current_status} />
          </div>

          {/* Tabs */}
          <Tabs
            tabs={[
              {
                id: 'details',
                label: 'Details',
                content: (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-4">Item Information</h3>
                        <div className="space-y-3">
                          {evidence.item_type_name && (
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Item Type</div>
                              <div className="font-medium">{evidence.item_type_name}</div>
                              {evidence.item_type_category && (
                                <div className="text-sm text-gray-500">({evidence.item_type_category})</div>
                              )}
                            </div>
                          )}
                          
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Collected Date</div>
                            <div className="font-medium">{new Date(evidence.collected_date).toLocaleDateString()}</div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Collected By</div>
                            <div className="font-medium">{evidence.collected_by}</div>
                          </div>
                          
                          {evidence.collection_location && (
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Collection Location</div>
                              <div className="font-medium">{evidence.collection_location}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-4">Current Status</h3>
                        <div className="space-y-3">
                          {evidence.current_location_name && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Location</div>
                                <div className="font-medium">{evidence.current_location_name}</div>
                                {evidence.current_location_building && (
                                  <div className="text-sm text-gray-500">
                                    {evidence.current_location_building}
                                    {evidence.current_location_room && ` - ${evidence.current_location_room}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {evidence.current_custodian_name && (
                            <div className="flex items-start gap-2">
                              <User className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Custodian</div>
                                <div className="font-medium">
                                  {evidence.current_custodian_full_name || evidence.current_custodian_name}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-2">
                            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Created</div>
                              <div className="font-medium">{formatDate(evidence.created_at)}</div>
                              {evidence.created_by_name && (
                                <div className="text-sm text-gray-500">by {evidence.created_by_name}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Extended Fields */}
                    {evidence.extended_fields && Object.keys(evidence.extended_fields).length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4">Type-Specific Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(evidence.extended_fields).map(([key, value]) => (
                            <div key={key}>
                              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div className="font-medium">{value as string || '—'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes Section */}
                    {evidence.notes && (
                      <div>
                        <h3 className="font-semibold mb-2">General Notes</h3>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm">{evidence.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              },
              {
                id: 'history',
                label: `Chain of Custody (${transfers.length})`,
                content: (
                  <div className="space-y-4">
                    {transfers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No custody transfers recorded
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {transfers.map((transfer: any) => (
                          <div 
                            key={transfer.id}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="font-semibold capitalize">{transfer.transfer_type} Transfer</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(transfer.initiated_at)}
                                </div>
                              </div>
                              <StatusBadge status={transfer.status} />
                            </div>
                            
                            {transfer.transfer_reason && (
                              <div className="mb-2">
                                <span className="text-sm font-medium">Reason: </span>
                                <span className="text-sm">{transfer.transfer_reason}</span>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-gray-600 dark:text-gray-400">From</div>
                                <div>{transfer.from_custodian_name || '—'}</div>
                                <div className="text-gray-500">{transfer.from_location_name || '—'}</div>
                              </div>
                              <div>
                                <div className="text-gray-600 dark:text-gray-400">To</div>
                                <div>{transfer.to_custodian_name || '—'}</div>
                                <div className="text-gray-500">{transfer.to_location_name || '—'}</div>
                              </div>
                            </div>
                            
                            {transfer.receipt_number && (
                              <div className="mt-2 text-xs text-gray-500">
                                Receipt: {transfer.receipt_number}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              },
              {
                id: 'notes',
                label: `Notes (${notes.length})`,
                content: (
                  <div className="space-y-4">
                    {/* Add Note */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={addingNote || !newNote.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>

                    {/* Notes List */}
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No notes yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notes.map((note: any) => (
                          <div 
                            key={note.id}
                            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-medium text-sm">
                                {note.created_by_full_name || note.created_by_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(note.created_at)}
                              </div>
                            </div>
                            <p className="text-sm">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              },
              {
                id: 'photos',
                label: `Photos (${photos.length})`,
                content: (
                  <div className="space-y-4">
                    {photos.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No photos uploaded</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {photos.map((photo: any) => (
                          <div key={photo.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <img 
                              src={photo.photo_path} 
                              alt={photo.caption || 'Evidence photo'}
                              className="w-full h-48 object-cover"
                            />
                            {photo.caption && (
                              <div className="p-2 text-sm">{photo.caption}</div>
                            )}
                            <div className="p-2 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
                              {photo.uploaded_by_name} • {formatDate(photo.uploaded_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Evidence item not found
        </div>
      )}
    </Modal>
  );
}
