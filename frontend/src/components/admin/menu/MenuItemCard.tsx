'use client'

import { MenuItem } from '@/types/menu.types'
import AvailabilityToggle from './AvailabilityToggle'
import { formatCurrency } from '@/utils/format'

interface MenuItemCardProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
  onToggleAvailability: (id: string) => Promise<void>
}

export default function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability
}: MenuItemCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors flex flex-col justify-between shadow-md">
      <div>
        {/* Image Section */}
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-40 object-cover border-b border-zinc-850"
          />
        ) : (
          <div className="h-40 bg-zinc-800 flex items-center justify-center border-b border-zinc-850">
            <span className="text-3xl text-zinc-600" role="img" aria-label="placeholder">
              🍽️
            </span>
          </div>
        )}

        {/* Content Section */}
        <div className="p-4 flex flex-col gap-1.5">
          {/* Category Badge */}
          <div className="flex">
            <span className="text-xs font-semibold bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full">
              {item.category.name}
            </span>
          </div>

          {/* Item Name */}
          <h4 className="font-semibold text-zinc-100 text-base truncate mt-1" title={item.name}>
            {item.name}
          </h4>

          {/* Description */}
          {item.description ? (
            <p className="text-xs text-zinc-500 line-clamp-2 h-8 leading-normal">
              {item.description}
            </p>
          ) : (
            <div className="h-8" /> // maintain spacing/alignment
          )}

          {/* Price & Toggle Row */}
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-lg font-bold text-amber-400">
              {formatCurrency(item.price)}
            </span>
            <AvailabilityToggle
              id={item.id}
              isAvailable={item.isAvailable}
              onToggle={onToggleAvailability}
              type="item"
            />
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex-1 py-1.5 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20 rounded-lg text-xs font-bold transition-all bg-transparent cursor-pointer"
          >
            Edit
          </button>
          
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="flex-1 py-1.5 border border-zinc-800 hover:border-zinc-700 text-red-400/70 hover:text-red-400 hover:bg-red-500/5 rounded-lg text-xs font-bold transition-all bg-transparent cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>

    </div>
  )
}
