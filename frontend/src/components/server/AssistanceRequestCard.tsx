'use client'

import { useState, useEffect } from 'react'
import { AssistanceRequest } from '@/types/server.types'
import { Button } from '@/components/ui/Button'
import Loader from '@/components/ui/Loader'
import { cn } from '@/utils/cn'

interface AssistanceRequestCardProps {
  request: AssistanceRequest
  onResolve: (requestId: string) => Promise<void>
  onViewBill?: (sessionId: string) => void
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

export default function AssistanceRequestCard({
  request,
  onResolve,
  onViewBill
}: AssistanceRequestCardProps) {
  const [isResolving, setIsResolving] = useState(false)
  const [elapsed, setElapsed] = useState('')
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    const update = () => setElapsed(getElapsedTime(request.createdAt))
    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [request.createdAt])

  useEffect(() => {
    const createdTime = new Date(request.createdAt).getTime()
    const now = Date.now()
    const diff = now - createdTime
    if (diff < 10000) {
      setIsNew(true)
      const timer = setTimeout(() => {
        setIsNew(false)
      }, Math.max(3000, 10000 - diff))
      return () => clearTimeout(timer)
    }
  }, [request.createdAt])

  const handleResolve = async () => {
    setIsResolving(true)
    try {
      await onResolve(request.id)
    } catch (err) {
      // Handled in parent
    } finally {
      setIsResolving(false)
    }
  }

  const getConfig = () => {
    switch (request.requestType) {
      case 'WATER':
        return {
          icon: '💧',
          accent: 'text-blue-400',
          badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          label: 'Water Requested'
        }
      case 'PLATE':
        return {
          icon: '🍽️',
          accent: 'text-orange-400',
          badgeBg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
          label: 'Plate Requested'
        }
      case 'BILL':
        return {
          icon: '💰',
          accent: 'text-accent-400',
          badgeBg: 'bg-accent-500/10 border-accent-500/20 text-accent-400',
          label: 'Payment Assistance Required'
        }
      case 'GENERAL':
      default:
        return {
          icon: '🔔',
          accent: 'text-text-secondary',
          badgeBg: 'bg-surface-overlay/60 border-border-primary text-text-secondary',
          label: 'Assistance Needed'
        }
    }
  }

  const config = getConfig()
  const isBill = request.requestType === 'BILL'

  return (
    <div
      className={cn(
        "bg-surface-raised border border-border-primary rounded-2xl p-4 flex flex-col justify-between min-h-[120px] transition-all duration-300",
        isBill && "bg-accent-500/5 border-accent-500/30",
        isNew && "ring-2 ring-accent-500/40 animate-pulse"
      )}
    >
      {/* Top row */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg select-none" role="img" aria-label="request-icon">
              {config.icon}
            </span>
            <span className={cn("font-semibold text-xs", config.accent)}>
              {config.label}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider", config.badgeBg)}>
              {request.requestType}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isBill && (
              <span className="bg-accent-500 text-surface-base text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                Priority
              </span>
            )}
            <span className="text-[10px] text-text-tertiary font-medium whitespace-nowrap">
              {elapsed}
            </span>
          </div>
        </div>

        {/* Table Number */}
        <div className="mb-4">
          <span className="text-2xl font-bold text-text-primary">
            Table {request.tableNumber}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full">
        {isBill ? (
          <div className="flex flex-col gap-2 w-full mt-1">
            <span className="text-xs text-accent-400 font-medium mb-1">Customer is viewing the bill.</span>
            <div className="flex gap-2 w-full">
              {onViewBill && (
                <button
                  type="button"
                  onClick={() => onViewBill(request.sessionId)}
                  className="bg-surface-overlay text-accent-400 hover:bg-surface-overlay/80 min-h-[48px] px-4 rounded-xl font-bold transition-all active:scale-[0.98] border-0 text-sm whitespace-nowrap"
                >
                  View Bill
                </button>
              )}
              <Button
                type="button"
                onClick={handleResolve}
                disabled={isResolving}
                className="bg-accent-500 text-surface-base hover:bg-accent-400 min-h-[48px] flex-1 rounded-xl font-bold border-0 text-sm active:scale-[0.98]"
              >
                {isResolving ? <Loader /> : "Go to Customer ✓"}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleResolve}
            disabled={isResolving}
            className="bg-semantic_success-500 hover:bg-semantic_success-400 text-surface-base min-h-[48px] w-full rounded-xl font-bold flex items-center justify-center gap-2 border-0 text-sm active:scale-[0.98] transition-all"
          >
            {isResolving ? (
              <Loader />
            ) : request.requestType === 'WATER' ? (
              'Delivered 💧'
            ) : request.requestType === 'PLATE' ? (
              'Delivered 🍽️'
            ) : (
              'On my way ✓'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
