'use client'

import { useState } from 'react'

interface AvailabilityToggleProps {
  id: string
  isAvailable: boolean
  onToggle: (id: string) => Promise<void>
  type: 'item' | 'category'
}

export default function AvailabilityToggle({
  id,
  isAvailable,
  onToggle,
  type
}: AvailabilityToggleProps) {
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isToggling) return

    setIsToggling(true)
    try {
      await onToggle(id)
    } catch (err) {
      // Handled in parent (error toast/revert)
    } finally {
      setIsToggling(false)
    }
  }

  const activeLabel = type === 'category' ? '● Active' : '● Available'
  const inactiveLabel = type === 'category' ? '○ Inactive' : '○ Unavailable'

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isToggling}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer select-none transition-all duration-250 flex items-center justify-center gap-1.5 border min-h-7 ${
        isToggling
          ? 'bg-surface-overlay text-text-tertiary border-border-secondary cursor-not-allowed'
          : isAvailable
          ? 'bg-semantic_success-500/20 text-semantic_success-400 border-semantic_success-500/30 hover:bg-semantic_success-500/30'
          : 'bg-surface-overlay text-text-secondary border-border-primary hover:bg-surface-overlay/80'
      }`}
    >
      {isToggling ? (
        <span className="inline-flex items-center gap-1">
          <svg
            className="animate-spin h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Saving...</span>
        </span>
      ) : isAvailable ? (
        activeLabel
      ) : (
        inactiveLabel
      )}
    </button>
  )
}
