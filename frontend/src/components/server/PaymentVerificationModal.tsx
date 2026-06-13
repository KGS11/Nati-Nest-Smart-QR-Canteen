'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import Loader from '@/components/ui/Loader'
import { PaymentMethod } from '@/types/server.types'

interface PaymentVerificationModalProps {
  paymentId: string
  tableNumber: string
  onClose: () => void
  onVerified: (paymentId: string) => void
  onError?: (message: string) => void
}

export default function PaymentVerificationModal({
  paymentId,
  tableNumber,
  onClose,
  onVerified,
  onError
}: PaymentVerificationModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [upiQrUrl, setUpiQrUrl] = useState<string | null>(null)
  const [isLoadingQr, setIsLoadingQr] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (selectedMethod === 'UPI') {
      const fetchQr = async () => {
        setIsLoadingQr(true)
        setLocalError(null)
        try {
          const res = await apiClient.get('/settings/upi-qr')
          if (!active) return
          const qrUrl = res.data?.data?.upiQrUrl || res.data?.upiQrUrl || ''
          setUpiQrUrl(qrUrl)
        } catch (err: any) {
          if (!active) return
          setLocalError('Failed to load UPI QR code.')
        } finally {
          if (active) setIsLoadingQr(false)
        }
      }
      fetchQr()
    }
    return () => {
      active = false
    }
  }, [selectedMethod])

  const handleVerify = async () => {
    if (!selectedMethod) return
    setIsVerifying(true)
    setLocalError(null)
    try {
      await apiClient.patch(`/payments/${paymentId}/verify`, {
        paymentMethod: selectedMethod
      })
      onVerified(paymentId)
      onClose()
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to verify payment.'
      setLocalError(errorMsg)
      if (onError) {
        onError(errorMsg)
      }
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full mx-auto mt-20 p-6 shadow-2xl relative flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Verify Payment</h2>
            <p className="text-sm text-zinc-400">Table {tableNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedMethod('CASH')}
            className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
              selectedMethod === 'CASH'
                ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            <span className="text-3xl mb-2" role="img" aria-label="cash">💵</span>
            <span className="text-sm font-semibold">Cash</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('UPI')}
            className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
              selectedMethod === 'UPI'
                ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            <span className="text-3xl mb-2" role="img" aria-label="upi">📱</span>
            <span className="text-sm font-semibold">UPI</span>
          </button>
        </div>

        {/* Content based on selection */}
        {selectedMethod === 'UPI' && (
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4 text-center">
            {isLoadingQr ? (
              <div className="py-6">
                <Loader label="Loading QR code..." />
              </div>
            ) : upiQrUrl ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code"
                  className="w-48 h-48 mx-auto bg-white p-2 rounded-lg border border-zinc-800"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Ask customer to scan and pay
                </p>
              </div>
            ) : (
              <p className="text-red-400 text-sm font-medium py-4">
                UPI QR not configured. Contact admin.
              </p>
            )}
          </div>
        )}

        {selectedMethod === 'CASH' && (
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-sm text-zinc-400 font-medium">
              Confirm customer has paid in cash
            </p>
          </div>
        )}

        {/* Error message */}
        {localError && (
          <p className="text-xs text-red-400 font-semibold text-center mt-1">
            {localError}
          </p>
        )}

        {/* Action button */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleVerify}
            disabled={!selectedMethod || isVerifying || (selectedMethod === 'UPI' && !upiQrUrl && !isLoadingQr)}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-colors text-center text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <Loader className="!flex-row !gap-1" />
            ) : (
              'Confirm Payment Received'
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 rounded-xl text-sm font-semibold transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}
