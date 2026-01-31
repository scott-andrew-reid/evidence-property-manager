'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Check, RotateCcw, Type, Pencil, Upload } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureData: string, type: 'hand-drawn' | 'typed' | 'uploaded') => void;
  onCancel: () => void;
  userName?: string;
}

export function SignaturePad({ onSave, onCancel, userName = 'User' }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState(userName);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleClear = () => {
    if (mode === 'draw') {
      sigCanvas.current?.clear();
    } else if (mode === 'type') {
      setTypedName('');
    } else if (mode === 'upload') {
      setUploadedImage(null);
    }
  };

  const handleSave = () => {
    if (mode === 'draw') {
      if (sigCanvas.current?.isEmpty()) {
        alert('Please provide a signature');
        return;
      }
      const dataUrl = sigCanvas.current?.toDataURL();
      if (dataUrl) {
        onSave(dataUrl, 'hand-drawn');
      }
    } else if (mode === 'type') {
      if (!typedName.trim()) {
        alert('Please enter your name');
        return;
      }
      // Generate a simple text signature image
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '36px cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
      }
      onSave(canvas.toDataURL(), 'typed');
    } else if (mode === 'upload') {
      if (!uploadedImage) {
        alert('Please upload a signature image');
        return;
      }
      onSave(uploadedImage, 'uploaded');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('draw')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            mode === 'draw'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Pencil className="h-4 w-4" />
          Draw
        </button>
        <button
          onClick={() => setMode('type')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            mode === 'type'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Type className="h-4 w-4" />
          Type
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            mode === 'upload'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* Signature Area */}
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
        {mode === 'draw' && (
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: 'w-full h-48 cursor-crosshair',
            }}
            backgroundColor="white"
          />
        )}
        
        {mode === 'type' && (
          <div className="p-8 h-48 flex flex-col items-center justify-center">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Enter your name"
              className="text-3xl font-cursive text-center border-b-2 border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-blue-500 px-4 py-2"
            />
            {typedName && (
              <div className="mt-4 text-4xl font-cursive text-gray-800">
                {typedName}
              </div>
            )}
          </div>
        )}
        
        {mode === 'upload' && (
          <div className="p-8 h-48 flex flex-col items-center justify-center">
            {uploadedImage ? (
              <img src={uploadedImage} alt="Signature" className="max-h-full max-w-full object-contain" />
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-600 dark:text-gray-400">
                <Upload className="h-12 w-12" />
                <span>Click to upload signature image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Clear
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Check className="h-4 w-4" />
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );
}
