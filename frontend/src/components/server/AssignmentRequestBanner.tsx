'use client'

import { WaiterAssignmentRequest } from '@/types/server.types'
import { Button } from '@/components/ui/Button'
import Loader from '@/components/ui/Loader'
import { useEffect, useState } from 'react'

interface AssignmentRequestBannerProps {
  requests: WaiterAssignmentRequest[]
  onAccept: (requestId: string) => Promise<void>
}

export function AssignmentRequestBanner({ requests, onAccept }: AssignmentRequestBannerProps) {
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000)
    return () => clearInterval(interval)
  }, [])

  if (requests.length === 0) return null

  const formatAge = (requestedAt: string) => {
    const diffMs = now - new Date(requestedAt).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    return `${diffMins}m ago`
  }

  const handleAcceptClick = async (requestId: string) => {
    setActioningId(requestId)
    try {
      await onAccept(requestId)
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className="bg-accent-500/10 border-b border-accent-500/30 p-4 animate-pulse">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        <h2 className="text-accent-400 font-extrabold text-sm tracking-wider uppercase">
          🔔 Pending Table Assignments ({requests.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {requests.map((req) => (
            <div
              key={req.requestId}
              className="bg-surface-raised border border-border-primary rounded-xl p-3 flex flex-col justify-between gap-3 shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-text-primary">Table {req.tableNumber}</h3>
                  <p className="text-xs text-text-secondary">Request: {formatAge(req.requestedAt)}</p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => handleAcceptClick(req.requestId)}
                disabled={actioningId !== null}
                className="w-full min-h-[52px] bg-accent-500 hover:bg-accent-400 text-surface-base font-black border-0 rounded-lg active:scale-[0.98] transition-all"
              >
                {actioningId === req.requestId ? <Loader className="scale-50" /> : `Accept Table ${req.tableNumber}`}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
