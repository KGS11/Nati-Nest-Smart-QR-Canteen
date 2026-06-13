'use client'

import { Button } from '@/components/ui/Button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>}
      </div>
      {action && (
        <Button
          type="button"
          onClick={action.onClick}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-1 text-sm border-0 self-start sm:self-auto min-h-10 shrink-0"
        >
          <span>+</span>
          <span>{action.label}</span>
        </Button>
      )}
    </div>
  )
}
