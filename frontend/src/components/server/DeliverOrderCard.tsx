'use client'

import { useState, useEffect } from 'react'
import { ReadyOrder } from '@/types/server.types'
import { Button } from '@/components/ui/Button'
import Loader from '@/components/ui/Loader'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/stores/authStore'

interface DeliverOrderCardProps {
  order: ReadyOrder
  onDeliver: (orderId: string) => Promise<void>
  onViewBill: (sessionId: string) => void
  onClaim?: (orderId: string) => Promise<void>
  onRelease?: (orderId: string) => Promise<void>
}

export default function DeliverOrderCard({
  order,
  onDeliver,
  onViewBill,
  onClaim,
  onRelease
}: DeliverOrderCardProps) {
  const { user } = useAuthStore()
  const [isDelivering, setIsDelivering] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [elapsedText, setElapsedText] = useState('')
  const [elapsedColor, setElapsedColor] = useState('text-green-400')

  const isAssignedToMe = order.assignedWaiterId === user?.id
  const isAssignedToOther = !!(order.assignedWaiterId && order.assignedWaiterId !== user?.id)
  const isUnassigned = !order.assignedWaiterId

  // Swipe gesture state
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [swipeTranslation, setSwipeTranslation] = useState<number>(0)
  const [swipeCount, setSwipeCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deliver_swipe_hint_count")
      return saved ? parseInt(saved, 10) : 0
    }
    return 0
  })

  useEffect(() => {
    const update = () => {
      const diffMs = Date.now() - new Date(order.readyAt).getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins >= 10) {
        setElapsedColor('text-red-400')
      } else if (diffMins >= 5) {
        setElapsedColor('text-amber-400')
      } else {
        setElapsedColor('text-green-400')
      }

      if (diffMins === 0) {
        setElapsedText('Ready just now')
      } else {
        setElapsedText(`Ready ${diffMins}m ago`)
      }
    }

    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [order.readyAt])

  const handleDeliver = async () => {
    setIsDelivering(true)
    try {
      await onDeliver(order.id)
    } catch (err) {
      // Handled in parent
    } finally {
      setIsDelivering(false)
    }
  }

  const handleClaim = async () => {
    if (!onClaim) return
    setIsClaiming(true)
    try {
      await onClaim(order.id)
    } catch (err) {
      // Handled in parent
    } finally {
      setIsClaiming(false)
    }
  }

  const handleRelease = async () => {
    if (!onRelease) return
    setIsReleasing(true)
    try {
      await onRelease(order.id)
    } catch (err) {
      // Handled in parent
    } finally {
      setIsReleasing(false)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isAssignedToMe) return
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isAssignedToMe || touchStartX === null) return
    const diffX = e.touches[0].clientX - touchStartX
    if (diffX > 0) {
      setSwipeTranslation(Math.min(120, diffX))
    }
  }

  const handleTouchEnd = () => {
    if (!isAssignedToMe) return
    if (swipeTranslation > 100 && !isDelivering) {
      handleDeliver()
      const nextCount = swipeCount + 1
      setSwipeCount(nextCount)
      if (typeof window !== "undefined") {
        localStorage.setItem("deliver_swipe_hint_count", String(nextCount))
      }
    }
    setTouchStartX(null)
    setSwipeTranslation(0)
  }

  const shortId = order.id.slice(-6).toUpperCase()
  const visibleItems = order.items.slice(0, 4)
  const overflowCount = order.items.length - 4

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${swipeTranslation}px)`,
        transition: touchStartX === null ? "transform 0.2s ease-out" : "none",
      }}
      className={cn(
        "bg-zinc-900 border border-zinc-800 border-l-4 rounded-2xl p-4 flex flex-col gap-3 shadow-md transition-all select-none",
        isAssignedToOther ? "border-l-zinc-700 opacity-60 saturate-50" : "border-l-green-500",
        swipeTranslation > 80 && "border-green-500/60 bg-green-500/5"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-xl font-bold text-amber-400">
            Table {order.tableNumber}
          </span>
          <span className={`text-xs font-semibold ${elapsedColor}`}>
            {elapsedText}
          </span>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          #{shortId}
        </span>
      </div>

      {order.assignedWaiterId && (
        <div className={cn(
          "rounded-xl p-2.5 text-xs font-semibold flex items-center gap-1.5",
          isAssignedToOther
            ? "bg-zinc-800/50 border border-zinc-700 text-zinc-400"
            : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
        )}>
          <span>👤</span>
          <span>
            {isAssignedToOther
              ? `Claimed by ${order.assignedWaiterName || 'another waiter'}`
              : "Claimed by me"}
          </span>
        </div>
      )}

      <div className="space-y-1 my-1">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={`text-sm flex justify-between ${
              item.status === 'REJECTED'
                ? 'line-through text-zinc-500'
                : 'text-zinc-300'
            }`}
          >
            <span className="truncate max-w-[200px]">
              {item.name}
            </span>
            <span className="font-semibold whitespace-nowrap">
              ×{item.quantity}
            </span>
          </div>
        ))}
        {overflowCount > 0 && (
          <div className="text-xs text-zinc-500 font-medium italic">
            +{overflowCount} more item{overflowCount > 1 ? 's' : ''}...
          </div>
        )}
      </div>

      {isAssignedToMe && swipeCount < 3 && (
        <div className="text-[10px] text-zinc-500 text-right animate-pulse select-none">
          → swipe right to deliver
        </div>
      )}

      <div className="flex items-center justify-between mt-1 gap-2">
        <button
          type="button"
          onClick={() => onViewBill(order.sessionId)}
          className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors bg-transparent border-0 cursor-pointer min-h-[48px] px-2"
        >
          View Bill
        </button>

        {isUnassigned && (
          <Button
            type="button"
            onClick={handleClaim}
            disabled={isClaiming}
            className="bg-amber-500 text-zinc-955 hover:bg-amber-400 min-h-[48px] px-4 rounded-xl font-semibold flex items-center justify-center gap-2 border-0 active:scale-95 transition-all text-sm animate-pulse"
          >
            {isClaiming ? <Loader className="!flex-row !gap-1 scale-75" /> : 'Claim Delivery'}
          </Button>
        )}

        {isAssignedToOther && (
          <span className="text-xs font-semibold text-zinc-500 italic">
            Claimed by {order.assignedWaiterName}
          </span>
        )}

        {isAssignedToMe && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRelease}
              disabled={isReleasing}
              className="border border-zinc-700 bg-zinc-800/30 text-zinc-350 hover:bg-zinc-800 min-h-[48px] px-3 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {isReleasing ? <Loader className="scale-50" /> : 'Release'}
            </Button>

            <Button
              type="button"
              onClick={handleDeliver}
              disabled={isDelivering}
              className="bg-green-500 text-zinc-950 hover:bg-green-400 min-h-[48px] px-4 rounded-xl font-semibold flex items-center justify-center gap-2 border-0 active:scale-95 transition-all text-sm"
            >
              {isDelivering ? (
                <Loader className="!flex-row !gap-1" />
              ) : (
                'Mark Delivered'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
