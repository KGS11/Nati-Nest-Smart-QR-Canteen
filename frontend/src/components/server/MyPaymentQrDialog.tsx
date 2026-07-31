'use client'

import { useEffect, useRef, useState } from 'react'
import apiClient from '@/lib/api-client'
import Loader from '@/components/ui/Loader'
import { Button } from '@/components/ui/Button'
import { getValidImageUrl } from '@/utils/imageUrl'

interface MyPaymentQrDialogProps {
  onClose: () => void
  onChanged?: () => void
}

export default function MyPaymentQrDialog({ onClose, onChanged }: MyPaymentQrDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadQr = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/server/payment-qr')
      setPaymentQrUrl(getValidImageUrl(res.data?.data?.paymentQrUrl))
    } catch (err: any) {
      setError(err?.message || 'Failed to load payment QR.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadQr()
  }, [])

  const handleUpload = async (file: File | undefined) => {
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    setIsSaving(true)
    setError(null)
    try {
      const res = await apiClient.post('/server/payment-qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPaymentQrUrl(getValidImageUrl(res.data?.data?.paymentQrUrl))
      onChanged?.()
    } catch (err: any) {
      setError(err?.message || 'Failed to upload payment QR.')
    } finally {
      setIsSaving(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await apiClient.delete('/server/payment-qr')
      setPaymentQrUrl(null)
      onChanged?.()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete payment QR.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-surface-raised border border-border-primary rounded-2xl max-w-md w-full mx-auto mt-20 p-6 shadow-2xl relative flex flex-col gap-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-text-primary">My Payment QR</h2>
            <p className="text-sm text-text-secondary">Upload your personal UPI QR for customer payments.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="bg-surface-base/40 border border-border-primary rounded-xl p-4 text-center min-h-[220px] flex items-center justify-center">
          {isLoading ? (
            <Loader label="Loading QR..." />
          ) : paymentQrUrl ? (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={paymentQrUrl}
                alt="My payment QR"
                className="w-48 h-48 mx-auto bg-white p-2 rounded-lg border border-border-primary object-contain"
              />
              <p className="text-xs text-text-secondary">This QR appears when you verify Online payments.</p>
            </div>
          ) : (
            <p className="text-sm font-medium text-text-secondary">No personal payment QR uploaded.</p>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 font-semibold text-center" role="alert">
            {error}
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => void handleUpload(event.target.files?.[0])}
        />

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="brand"
            disabled={isSaving}
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-12 bg-accent-500 hover:bg-accent-400 text-surface-base border-0 font-bold"
          >
            {isSaving ? <Loader className="!flex-row !gap-1" /> : paymentQrUrl ? 'Replace QR' : 'Upload QR'}
          </Button>

          {paymentQrUrl && (
            <Button
              type="button"
              variant="destructive"
              disabled={isSaving}
              onClick={handleDelete}
              className="w-full h-11"
            >
              Delete QR
            </Button>
          )}

          <Button type="button" variant="secondary" onClick={onClose} className="w-full h-11">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
