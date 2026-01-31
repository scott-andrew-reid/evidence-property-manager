'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Modal, ModalFooter } from './ui/modal';
import { SignaturePad } from './ui/signature-pad';

interface TransferWizardProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceItem: {
    id: number;
    case_number: string;
    item_number: string;
    description: string;
    current_custodian_id?: number;
    current_location_id?: number;
  } | null;
  onComplete: () => void;
}

type TransferStep = 'type' | 'details' | 'signatures' | 'confirm';

export function TransferWizard({ isOpen, onClose, evidenceItem, onComplete }: TransferWizardProps) {
  const [step, setStep] = useState<TransferStep>('type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [transferData, setTransferData] = useState({
    transfer_type: '' as 'receipt' | 'internal' | 'release' | 'disposal' | '',
    transfer_reason_id: null as number | null,
    transfer_reason_text: '',
    to_custodian_id: null as number | null,
    to_location_id: null as number | null,
    condition_notes: '',
    transfer_notes: '',
    from_signature: null as string | null,
    to_signature: null as string | null
  });

  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [transferReasons, setTransferReasons] = useState<any[]>([]);
  const [showSignaturePad, setShowSignaturePad] = useState<'from' | 'to' | null>(null);

  // Fetch lookups when modal opens
  useState(() => {
    if (isOpen) {
      fetchLookups();
    }
  });

  const fetchLookups = async () => {
    try {
      const [usersRes, locationsRes, reasonsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/lookups/locations'),
        fetch('/api/lookups/transfer-reasons')
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setLocations(data.locations || []);
      }

      if (reasonsRes.ok) {
        const data = await reasonsRes.json();
        setTransferReasons(data.transfer_reasons || []);
      }
    } catch (err) {
      console.error('Failed to fetch lookups:', err);
    }
  };

  const handleNext = () => {
    setError(null);

    if (step === 'type') {
      if (!transferData.transfer_type) {
        setError('Please select a transfer type');
        return;
      }
      setStep('details');
    } else if (step === 'details') {
      if (!transferData.to_custodian_id && !transferData.to_location_id) {
        setError('Please select at least a custodian or location');
        return;
      }
      setStep('signatures');
    } else if (step === 'signatures') {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 'details') setStep('type');
    else if (step === 'signatures') setStep('details');
    else if (step === 'confirm') setStep('signatures');
  };

  const handleSubmit = async () => {
    if (!evidenceItem) return;

    setLoading(true);
    setError(null);

    try {
      // Create signatures if provided
      let fromSigId = null;
      let toSigId = null;

      if (transferData.from_signature) {
        const fromSigRes = await fetch('/api/signatures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signature_type: 'hand-drawn',
            signature_data: transferData.from_signature
          })
        });

        if (fromSigRes.ok) {
          const data = await fromSigRes.json();
          fromSigId = data.id;
        }
      }

      if (transferData.to_signature) {
        const toSigRes = await fetch('/api/signatures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signature_type: 'hand-drawn',
            signature_data: transferData.to_signature
          })
        });

        if (toSigRes.ok) {
          const data = await toSigRes.json();
          toSigId = data.id;
        }
      }

      // Create transfer
      const transferRes = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidence_item_id: evidenceItem.id,
          transfer_type: transferData.transfer_type,
          transfer_reason_id: transferData.transfer_reason_id,
          transfer_reason_text: transferData.transfer_reason_text,
          to_custodian_id: transferData.to_custodian_id,
          to_location_id: transferData.to_location_id,
          condition_notes: transferData.condition_notes,
          transfer_notes: transferData.transfer_notes,
          from_signature_id: fromSigId,
          to_signature_id: toSigId
        })
      });

      if (!transferRes.ok) {
        const errorData = await transferRes.json();
        throw new Error(errorData.error || 'Failed to create transfer');
      }

      // Success!
      onComplete();
      onClose();
      resetWizard();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setStep('type');
    setTransferData({
      transfer_type: '',
      transfer_reason_id: null,
      transfer_reason_text: '',
      to_custodian_id: null,
      to_location_id: null,
      condition_notes: '',
      transfer_notes: '',
      from_signature: null,
      to_signature: null
    });
    setError(null);
  };

  if (!evidenceItem) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Evidence" size="lg">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {(['type', 'details', 'signatures', 'confirm'] as TransferStep[]).map((s, index) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step === s ? 'border-blue-600 bg-blue-600 text-white' : 
              (['type', 'details', 'signatures', 'confirm'] as TransferStep[]).indexOf(step) > index
                ? 'border-green-600 bg-green-600 text-white'
                : 'border-gray-300 text-gray-400'
            }`}>
              {(['type', 'details', 'signatures', 'confirm'] as TransferStep[]).indexOf(step) > index ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < 3 && (
              <div className={`w-16 h-0.5 ${
                (['type', 'details', 'signatures', 'confirm'] as TransferStep[]).indexOf(step) > index
                  ? 'bg-green-600'
                  : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}

      {/* Evidence Info */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-2">Evidence Item</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {evidenceItem.case_number}-{evidenceItem.item_number}: {evidenceItem.description}
        </p>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {step === 'type' && (
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">Select Transfer Type</h3>
            {[
              { value: 'internal', label: 'Internal Transfer', desc: 'Transfer between analysts/locations' },
              { value: 'release', label: 'Release', desc: 'Return to owner or external party' },
              { value: 'disposal', label: 'Disposal', desc: 'Destroy or dispose of evidence' }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setTransferData({ ...transferData, transfer_type: type.value as any })}
                className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                  transferData.transfer_type === type.value
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <div className="font-semibold">{type.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{type.desc}</div>
              </button>
            ))}
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">Transfer Details</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Transfer Reason</label>
              <select
                value={transferData.transfer_reason_id || ''}
                onChange={(e) => setTransferData({ ...transferData, transfer_reason_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              >
                <option value="">Select a reason...</option>
                {transferReasons.map(reason => (
                  <option key={reason.id} value={reason.id}>{reason.reason}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">To Custodian</label>
              <select
                value={transferData.to_custodian_id || ''}
                onChange={(e) => setTransferData({ ...transferData, to_custodian_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              >
                <option value="">Select custodian...</option>
                {users.filter(u => u.is_active).map(user => (
                  <option key={user.id} value={user.id}>{user.full_name || user.username}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">To Location</label>
              <select
                value={transferData.to_location_id || ''}
                onChange={(e) => setTransferData({ ...transferData, to_location_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
              >
                <option value="">Select location...</option>
                {locations.filter(l => l.active).map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Condition Notes</label>
              <textarea
                value={transferData.condition_notes}
                onChange={(e) => setTransferData({ ...transferData, condition_notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="Describe the condition of the evidence..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Transfer Notes</label>
              <textarea
                value={transferData.transfer_notes}
                onChange={(e) => setTransferData({ ...transferData, transfer_notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                placeholder="Additional notes about this transfer..."
              />
            </div>
          </div>
        )}

        {step === 'signatures' && (
          <div className="space-y-6">
            <h3 className="font-semibold mb-4">Signatures</h3>
            
            {showSignaturePad ? (
              <SignaturePad
                onSave={(data, type) => {
                  if (showSignaturePad === 'from') {
                    setTransferData({ ...transferData, from_signature: data });
                  } else {
                    setTransferData({ ...transferData, to_signature: data });
                  }
                  setShowSignaturePad(null);
                }}
                onCancel={() => setShowSignaturePad(null)}
              />
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">From Custodian Signature</label>
                  {transferData.from_signature ? (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                      <img src={transferData.from_signature} alt="From signature" className="max-h-24" />
                      <button
                        onClick={() => setTransferData({ ...transferData, from_signature: null })}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSignaturePad('from')}
                      className="w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      Click to sign
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">To Custodian Signature</label>
                  {transferData.to_signature ? (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                      <img src={transferData.to_signature} alt="To signature" className="max-h-24" />
                      <button
                        onClick={() => setTransferData({ ...transferData, to_signature: null })}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSignaturePad('to')}
                      className="w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      Click to sign
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">Confirm Transfer</h3>
            
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Transfer Type</div>
                <div className="font-medium capitalize">{transferData.transfer_type}</div>
              </div>
              
              {transferData.to_custodian_id && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">To Custodian</div>
                  <div className="font-medium">
                    {users.find(u => u.id === transferData.to_custodian_id)?.full_name || 
                     users.find(u => u.id === transferData.to_custodian_id)?.username}
                  </div>
                </div>
              )}
              
              {transferData.to_location_id && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">To Location</div>
                  <div className="font-medium">
                    {locations.find(l => l.id === transferData.to_location_id)?.name}
                  </div>
                </div>
              )}
              
              {transferData.condition_notes && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Condition Notes</div>
                  <div className="font-medium">{transferData.condition_notes}</div>
                </div>
              )}
              
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Signatures</div>
                <div className="font-medium">
                  {transferData.from_signature && transferData.to_signature 
                    ? 'Both signatures captured' 
                    : transferData.from_signature || transferData.to_signature
                    ? 'One signature captured'
                    : 'No signatures'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <ModalFooter>
        {step !== 'type' && (
          <button
            onClick={handleBack}
            disabled={loading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4 inline mr-2" />
            Back
          </button>
        )}
        
        <div className="flex-1" />
        
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        
        {step !== 'confirm' ? (
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Next
            <ArrowRight className="h-4 w-4 inline ml-2" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Complete Transfer
              </>
            )}
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
