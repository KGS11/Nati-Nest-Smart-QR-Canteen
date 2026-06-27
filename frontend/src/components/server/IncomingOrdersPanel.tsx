'use client'

import { InProgressOrder } from '@/types/server.types'
import { cn } from '@/utils/cn'
import { useState, useEffect } from 'react'

interface IncomingOrdersPanelProps {
  orders: InProgressOrder[]
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PLACED: { label: 'New Order', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  ACCEPTED: { label: 'Accepted', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  PREPARING: { label: 'Cooking', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' },
}

function ElapsedTime({ placedAt }: { placedAt: string }) {
  const [text, setText] = useState('')
  const [color, setColor] = useState('text-zinc-500')

  useEffect(() => {
    const update = () => {
      const diffMs = Date.now() - new Date(placedAt).getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins >= 15) {
        setColor('text-red-400')
      } else if (diffMins >= 8) {
        setColor('text-amber-400')
      } else {
        setColor('text-zinc-500')
      }

      if (diffMins === 0) {
        setText('Just now')
      } else {
        setText(`${diffMins}m ago`)
      }
    }

    update()
    const interval = setInterval(update, 15000)
    return () => clearInterval(interval)
  }, [placedAt])

  return <span className={`text-xs font-medium ${color}`}>{text}</span>
}

export default function IncomingOrdersPanel({ orders }: IncomingOrdersPanelProps) {
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()
  )

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
        <h2 className="font-semibold text-zinc-100 text-base flex items-center gap-2">
          📋 Incoming Orders
        </h2>
        <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
          {orders.length}
        </span>
      </div>

      {/* Panel Content */}
      {sortedOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="text-4xl mb-2">🍽️</span>
          <p className="text-sm font-medium text-zinc-500">
            No orders in kitchen yet
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            New orders from your tables will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 p-3 scrollbar-thin">
          {sortedOrders.map((order) => {
            const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.PLACED
            const shortId = order.id.slice(-6).toUpperCase()

            return (
              <div
                key={order.id}
                className="bg-zinc-900 border border-zinc-800 border-l-4 rounded-2xl p-4 flex flex-col gap-2 shadow-md border-l-amber-500"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-amber-400">
                      Table {order.tableNumber}
                    </span>
                    <ElapsedTime placedAt={order.placedAt} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-mono text-zinc-500">
                      #{shortId}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      statusInfo.bg,
                      statusInfo.color
                    )}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Kitchen Assignment */}
                {order.assignedKitchenName && (
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <span>👨‍🍳</span>
                    <span>Cook: <span className="text-zinc-400 font-semibold">{order.assignedKitchenName}</span></span>
                  </div>
                )}

                {/* Order Items — the key feature */}
                <div className="space-y-1 my-1 bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">Order Items</p>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="text-sm flex justify-between text-zinc-300"
                    >
                      <span className="truncate max-w-[200px]">
                        {item.name}
                      </span>
                      <span className="font-semibold whitespace-nowrap text-zinc-400">
                        ×{item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items.length === 0 && (
                    <p className="text-xs text-zinc-600 italic">No items</p>
                  )}
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center pt-1 border-t border-zinc-800/50">
                  <span className="text-xs text-zinc-500">Subtotal</span>
                  <span className="text-sm font-bold text-zinc-300">
                    ₹{order.subtotal.toFixed(0)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
