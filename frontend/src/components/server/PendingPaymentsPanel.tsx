'use client'

import { PendingPayment } from '@/types/server.types'
import { Button } from '@/components/ui/Button'

interface PendingPaymentsPanelProps {
  payments: PendingPayment[]
  onVerifyPayment: (paymentId: string, tableNumber: string) => void
}

const formatCurrency = (amount: number): string =>
  `₹ ${amount.toFixed(2)}`

export default function PendingPaymentsPanel({
  payments,
  onVerifyPayment
}: PendingPaymentsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-surface-base">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-primary bg-surface-raised/40 shrink-0">
        <h2 className="font-semibold text-text-primary text-base">
          Pending Payments
        </h2>
        <span className="bg-accent-500/20 text-accent-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
          {payments.length}
        </span>
      </div>

      {/* Panel Content */}
      {payments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm font-medium text-text-tertiary">No pending payments</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 p-3 scrollbar-thin">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-surface-overlay border border-border-secondary/50 rounded-lg p-3 flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex flex-col">
                <span className="text-xs text-text-secondary font-medium">Table</span>
                <span className="text-base font-bold text-accent-400">
                  {payment.tableNumber}
                </span>
              </div>

              <div className="flex-1 text-center">
                <span className="text-sm font-semibold text-text-primary">
                  {formatCurrency(payment.totalAmount)}
                </span>
              </div>

              <Button
                type="button"
                onClick={() => onVerifyPayment(payment.id, payment.tableNumber)}
                className="bg-accent-500 text-surface-base hover:bg-accent-400 text-xs font-bold py-1 px-3 min-h-8 rounded-md border-0 shrink-0"
              >
                Verify
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
