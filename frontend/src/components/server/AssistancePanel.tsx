'use client'

import { useState, useEffect } from 'react'
import { AssistanceRequest, ReadyOrder, PendingPayment } from '@/types/server.types'
import AssistanceRequestCard from './AssistanceRequestCard'
import DeliverOrderCard from './DeliverOrderCard'

interface AssistancePanelProps {
  requests: AssistanceRequest[]
  onResolve: (requestId: string) => Promise<void>
  onViewBill: (sessionId: string) => void
  readyOrders?: ReadyOrder[]
  pendingPayments?: PendingPayment[]
  onDeliver?: (orderId: string) => Promise<void>
  onVerifyPayment?: (paymentId: string, tableNumber: string) => void
}

function getElapsedTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  if (diffSecs < 60) return 'Just now'
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  return `${diffHours}h ago`
}

export default function AssistancePanel({
  requests,
  onResolve,
  onViewBill,
  readyOrders = [],
  pendingPayments = [],
  onDeliver,
  onVerifyPayment
}: AssistancePanelProps) {
  // Sort utility
  const sortByTime = (a: { createdAt?: string; readyAt?: string }, b: { createdAt?: string; readyAt?: string }) => {
    const timeA = new Date(a.createdAt || a.readyAt || 0).getTime()
    const timeB = new Date(b.createdAt || b.readyAt || 0).getTime()
    return timeA - timeB
  }

  // Priority 1: Assistance requests of type 'BILL'
  const billRequests = requests
    .filter((r) => r.requestType === 'BILL')
    .sort(sortByTime)

  // Priority 2: Pending Payments
  const paymentsList = [...pendingPayments].sort(sortByTime)

  // Priority 3: Ready Orders
  const ordersList = [...readyOrders].sort((a, b) => new Date(a.readyAt).getTime() - new Date(b.readyAt).getTime())

  // Priority 4: Assistance requests of type 'WATER'
  const waterRequests = requests
    .filter((r) => r.requestType === 'WATER')
    .sort(sortByTime)

  // Priority 5: Assistance requests of type 'GENERAL'
  const generalRequests = requests
    .filter((r) => r.requestType === 'GENERAL')
    .sort(sortByTime)

  const hasItems =
    billRequests.length > 0 ||
    paymentsList.length > 0 ||
    ordersList.length > 0 ||
    waterRequests.length > 0 ||
    generalRequests.length > 0

  const totalCount = requests.length + paymentsList.length + ordersList.length

  // State to force re-render for elapsed times
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
        <h2 className="font-semibold text-zinc-100 text-base">
          Priority Feed
        </h2>
        <span
          className={`bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full ${
            hasItems ? 'animate-pulse' : ''
          }`}
        >
          {totalCount}
        </span>
      </div>

      {/* Panel Content */}
      {!hasItems ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="text-5xl mb-2 select-none" role="img" aria-label="bell">🔔</span>
          <p className="text-sm font-medium text-zinc-500">No pending alerts</p>
        </div>
      ) : (
        <div className="space-y-6 overflow-y-auto flex-1 p-3 scrollbar-thin">
          
          {/* Section: BILL & PAYMENT (Priority 1 & 2) */}
          {(billRequests.length > 0 || paymentsList.length > 0) && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider px-1 flex items-center gap-1.5 border-b border-zinc-800/60 pb-1">
                <span>🧾</span> Bill & Payment Verification
              </div>
              <div className="space-y-3">
                {/* Render Priority 1: Bill requests */}
                {billRequests.map((req) => (
                  <AssistanceRequestCard
                    key={req.id}
                    request={req}
                    onResolve={onResolve}
                    onViewBill={onViewBill}
                  />
                ))}

                {/* Render Priority 2: Pending Payments */}
                {paymentsList.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between min-h-[120px] transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg select-none" role="img" aria-label="money">💰</span>
                          <span className="font-semibold text-xs text-emerald-400">
                            Verify Payment
                          </span>
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
                            {payment.paymentMethod}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">
                          {getElapsedTime(payment.createdAt)}
                        </span>
                      </div>
                      <div className="mb-4 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-zinc-100">
                          Table {payment.tableNumber}
                        </span>
                        <span className="text-lg font-bold text-emerald-400">
                          ₹{payment.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full">
                      <button
                        type="button"
                        onClick={() => onVerifyPayment?.(payment.id, payment.tableNumber)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 min-h-[48px] w-full rounded-xl font-bold flex items-center justify-center gap-2 border-0 text-sm active:scale-[0.98] transition-all"
                      >
                        Verify Payment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: READY TO DELIVER (Priority 3) */}
          {ordersList.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider px-1 flex items-center gap-1.5 border-b border-zinc-800/60 pb-1">
                <span>🍽️</span> Ready to Deliver
              </div>
              <div className="space-y-3">
                {ordersList.map((order) => (
                  <DeliverOrderCard
                    key={order.id}
                    order={order}
                    onDeliver={onDeliver || (async () => {})}
                    onViewBill={onViewBill}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: OTHER REQUESTS (Priority 4 & 5) */}
          {(waterRequests.length > 0 || generalRequests.length > 0) && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1 flex items-center gap-1.5 border-b border-zinc-800/60 pb-1">
                <span>🔔</span> Other Requests
              </div>
              <div className="space-y-3">
                {/* Render Priority 4: Water requests */}
                {waterRequests.map((req) => (
                  <AssistanceRequestCard
                    key={req.id}
                    request={req}
                    onResolve={onResolve}
                    onViewBill={onViewBill}
                  />
                ))}

                {/* Render Priority 5: General requests */}
                {generalRequests.map((req) => (
                  <AssistanceRequestCard
                    key={req.id}
                    request={req}
                    onResolve={onResolve}
                    onViewBill={onViewBill}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
