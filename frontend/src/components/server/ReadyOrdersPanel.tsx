'use client'

import { useState } from 'react'
import { ReadyOrder } from '@/types/server.types'
import DeliverOrderCard from './DeliverOrderCard'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'

interface ReadyOrdersPanelProps {
  orders: ReadyOrder[]
  onDeliver: (orderId: string) => Promise<void>
  onViewBill: (sessionId: string) => void
  onClaim?: (orderId: string) => Promise<void>
  onRelease?: (orderId: string) => Promise<void>
}

export default function ReadyOrdersPanel({
  orders,
  onDeliver,
  onViewBill,
  onClaim,
  onRelease
}: ReadyOrdersPanelProps) {
  const { user } = useAuthStore()
  const [viewMode, setViewMode] = useState<'available' | 'my-deliveries'>('available')

  const myDeliveries = orders.filter(o => o.assignedWaiterId === user?.id)
  const filteredOrders = viewMode === 'available' ? orders : myDeliveries

  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(a.readyAt).getTime() - new Date(b.readyAt).getTime()
  )

  return (
    <div className="flex flex-col h-full bg-surface-base">
      {/* Panel Header */}
      <div className="flex flex-col border-b border-border-primary bg-surface-raised/40 shrink-0">
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="font-semibold text-text-primary text-base flex items-center gap-2">
            Ready for Delivery
          </h2>
          <span className="bg-semantic_success-500/20 text-semantic_success-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {orders.length}
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex p-2 gap-2 bg-surface-base/40 border-t border-border-primary">
          <button
            onClick={() => setViewMode('available')}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all",
              viewMode === 'available'
                ? "bg-semantic_success-500/10 border-semantic_success-500/30 text-semantic_success-400"
                : "border-border-primary text-text-secondary hover:text-text-primary"
            )}
          >
            Available
          </button>
          <button
            onClick={() => setViewMode('my-deliveries')}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all",
              viewMode === 'my-deliveries'
                ? "bg-semantic_success-500/10 border-semantic_success-500/30 text-semantic_success-400"
                : "border-border-primary text-text-secondary hover:text-text-primary"
            )}
          >
            My Deliveries ({myDeliveries.length})
          </button>
        </div>
      </div>

      {/* Panel Content */}
      {sortedOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="text-5xl text-semantic_success-400 mb-2" role="img" aria-label="done">✓</span>
          <p className="text-sm font-medium text-text-tertiary">
            {viewMode === 'my-deliveries' ? 'No active claims' : 'All orders delivered'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 p-3 scrollbar-thin">
          {sortedOrders.map((order) => (
            <DeliverOrderCard
              key={order.id}
              order={order}
              onDeliver={onDeliver}
              onViewBill={onViewBill}
              onClaim={onClaim}
              onRelease={onRelease}
            />
          ))}
        </div>
      )}
    </div>
  )
}
