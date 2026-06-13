'use client'

import { ReadyOrder } from '@/types/server.types'
import DeliverOrderCard from './DeliverOrderCard'

interface ReadyOrdersPanelProps {
  orders: ReadyOrder[]
  onDeliver: (orderId: string) => Promise<void>
  onViewBill: (sessionId: string) => void
}

export default function ReadyOrdersPanel({
  orders,
  onDeliver,
  onViewBill
}: ReadyOrdersPanelProps) {
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.readyAt).getTime() - new Date(b.readyAt).getTime()
  )

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
        <h2 className="font-semibold text-zinc-100 text-base flex items-center gap-2">
          Ready for Delivery
        </h2>
        <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
          {orders.length}
        </span>
      </div>

      {/* Panel Content */}
      {sortedOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="text-5xl text-green-400 mb-2" role="img" aria-label="done">✓</span>
          <p className="text-sm font-medium text-zinc-500">All orders delivered</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 p-3 scrollbar-thin">
          {sortedOrders.map((order) => (
            <DeliverOrderCard
              key={order.id}
              order={order}
              onDeliver={onDeliver}
              onViewBill={onViewBill}
            />
          ))}
        </div>
      )}
    </div>
  )
}
