"use client"

import { useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'

interface SignatureCaptureProps {
  label: string
  onSave: (dataUrl: string) => void
  value?: string
}

export function SignatureCapture({ label, onSave, value }: SignatureCaptureProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)

  useEffect(() => {
    if (value && sigCanvas.current) {
      sigCanvas.current.fromDataURL(value)
    }
  }, [value])

  function handleClear() {
    sigCanvas.current?.clear()
  }

  function handleSave() {
    if (sigCanvas.current) {
      const dataUrl = sigCanvas.current.toDataURL()
      onSave(dataUrl)
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            Clear
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
      
      <div className="border rounded bg-white dark:bg-gray-900">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-40 touch-none',
            style: { width: '100%', height: '160px' }
          }}
          backgroundColor="transparent"
        />
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Sign above using mouse, touch, or stylus
      </p>
    </div>
  )
}
