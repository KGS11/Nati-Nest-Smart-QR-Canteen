'use client'

import { MenuCategory } from '@/types/menu.types'
import AvailabilityToggle from './AvailabilityToggle'

interface CategoryCardProps {
  category: MenuCategory
  onEdit: (category: MenuCategory) => void
  onDelete: (category: MenuCategory) => void
  onToggleActive: (id: string) => Promise<void>
}

export default function CategoryCard({
  category,
  onEdit,
  onDelete,
  onToggleActive
}: CategoryCardProps) {
  const itemCount = category._count?.items ?? 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors flex flex-col justify-between gap-3 shadow-md">
      {/* Top Row */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-100 text-base leading-tight">
            {category.name}
          </span>
          <span className="text-xs text-zinc-500 mt-1 font-medium">
            Order: {category.sortOrder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(category)}
            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/50 rounded-lg transition-colors bg-transparent border-0 cursor-pointer text-sm leading-none"
            title="Edit category"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDelete(category)}
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 rounded-lg transition-colors bg-transparent border-0 cursor-pointer text-sm leading-none"
            title="Delete category"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="mt-3 flex items-center justify-between gap-4 border-t border-zinc-800/50 pt-3">
        <span className="bg-zinc-800 text-zinc-400 text-xs px-2.5 py-1 rounded-md font-semibold">
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>

        <AvailabilityToggle
          id={category.id}
          isAvailable={category.isActive}
          onToggle={onToggleActive}
          type="category"
        />
      </div>
    </div>
  )
}
