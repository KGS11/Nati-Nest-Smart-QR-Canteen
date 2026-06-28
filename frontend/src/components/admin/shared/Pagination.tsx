'use client'

import { PaginationMeta } from '@/types/menu.types'

interface PaginationProps {
  pagination: PaginationMeta
  onPageChange: (page: number) => void
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { total, page, limit, totalPages } = pagination

  if (totalPages <= 1) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  const getPages = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')

      const startPage = Math.max(2, page - 1)
      const endPage = Math.min(totalPages - 1, page + 1)

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const pages = getPages()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 py-4 border-t border-border-primary shrink-0">
      {/* Left indicator */}
      <span className="text-sm text-text-secondary">
        Showing <span className="font-semibold text-text-primary">{start}</span>–
        <span className="font-semibold text-text-primary">{end}</span> of{' '}
        <span className="font-semibold text-text-primary">{total}</span> items
      </span>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Previous */}
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="bg-surface-overlay text-text-secondary hover:bg-surface-overlay/80 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg text-sm transition-colors border-0 cursor-pointer"
        >
          Previous
        </button>

        {/* Page numbers */}
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ell-${idx}`} className="text-text-tertiary px-2 select-none">
                ...
              </span>
            )
          }

          const pageNum = p as number
          const isCurrent = pageNum === page

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium border-0 cursor-pointer ${
                isCurrent
                  ? 'bg-accent-500 text-surface-base font-bold'
                  : 'bg-surface-overlay text-text-secondary hover:bg-surface-overlay/80'
              }`}
            >
              {pageNum}
            </button>
          )
        })}

        {/* Next */}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="bg-surface-overlay text-text-secondary hover:bg-surface-overlay/80 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg text-sm transition-colors border-0 cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  )
}
