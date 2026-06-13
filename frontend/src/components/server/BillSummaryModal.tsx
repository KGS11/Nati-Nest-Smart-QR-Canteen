'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import Loader from '@/components/ui/Loader'
import { BillSummary, PendingPayment } from '@/types/server.types'

interface BillSummaryModalProps {
  sessionId: string
  tableNumber: string
  onClose: () => void
  onRequestPaymentVerification: (paymentId: string) => void
}

const formatCurrency = (amount: number): string =>
  `₹ ${amount.toFixed(2)}`

export default function BillSummaryModal({
  sessionId,
  tableNumber,
  onClose,
  onRequestPaymentVerification
}: BillSummaryModalProps) {
  const [bill, setBill] = useState<BillSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const fetchBillAndPayment = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [billRes, paymentsRes] = await Promise.all([
          apiClient.get(`/server/sessions/${sessionId}/bill`),
          apiClient.get('/payments/pending')
        ])

        if (!active) return

        // Extract bill data. Depending on API design, it might be nested under billRes.data.data or billRes.data.data.bill
        const fetchedBill = billRes.data?.data?.bill || billRes.data?.data || billRes.data
        setBill(fetchedBill)

        const paymentsList: PendingPayment[] = paymentsRes.data?.data?.payments || paymentsRes.data?.data || []
        const matchingPayment = paymentsList.find(
          (p) => p.sessionId === sessionId && p.status === 'PENDING'
        )

        if (matchingPayment) {
          setPaymentId(matchingPayment.id)
        } else {
          setPaymentId(null)
        }
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Failed to retrieve bill details.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    fetchBillAndPayment()

    return () => {
      active = false
    }
  }, [sessionId])

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full mx-auto mt-20 p-6 max-h-[80vh] overflow-y-auto shadow-2xl relative flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Bill Summary</h2>
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader label="Fetching bill details..." />
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="text-center py-6">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && bill && (
          <>
            {/* Table */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-400 bg-zinc-900/50">
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Price</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.itemBreakdown.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`text-sm text-zinc-300 border-b border-zinc-800/30 last:border-b-0 ${
                        idx % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium">{item.name}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right text-amber-400 font-semibold">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Row */}
            <div className="flex justify-between items-center py-3 px-4 bg-zinc-950/40 border border-zinc-800/80 rounded-xl">
              <span className="font-semibold text-zinc-100">Total</span>
              <span className="text-xl font-bold text-amber-400">
                {formatCurrency(bill.totalAmount)}
              </span>
            </div>

            {/* Payment Section */}
            <div className="mt-2">
              {paymentId ? (
                <button
                  type="button"
                  onClick={() => {
                    onRequestPaymentVerification(paymentId)
                    onClose()
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-colors text-center text-sm shadow-md"
                >
                  Verify Payment
                </button>
              ) : (
                <p className="text-center text-sm text-zinc-500 italic">
                  Payment not yet requested
                </p>
              )}
            </div>
          </>
        )}

        {/* Footer close */}
        <div className="mt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 rounded-xl text-sm font-semibold transition-colors bg-transparent cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
