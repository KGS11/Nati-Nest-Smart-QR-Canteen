'use client'

import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <span className="text-4xl mb-4" role="img" aria-label="empty-state-icon">
        {icon}
      </span>
      <h3 className="text-lg font-medium text-zinc-300">{title}</h3>
      {description && <p className="text-sm text-zinc-500 mt-1 max-w-sm">{description}</p>}
      {action && (
        <Button
          type="button"
          onClick={action.onClick}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm mt-4 border-0 min-h-10"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
