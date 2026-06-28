'use client'

import Loader from '@/components/ui/Loader'

interface DeleteConfirmModalProps {
  title: string
  description: string
  onConfirm: () => Promise<void>
  onCancel: () => void
  isDeleting: boolean
}

export default function DeleteConfirmModal({
  title,
  description,
  onConfirm,
  onCancel,
  isDeleting
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-surface-raised border border-border-primary rounded-2xl max-w-sm w-full mx-auto mt-40 p-6 shadow-2xl relative text-center">
        
        {/* Warning Icon */}
        <span className="text-3xl text-red-400 mb-4 block" role="img" aria-label="warning">
          ⚠️
        </span>

        {/* Title */}
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>

        {/* Description */}
        <p className="text-sm text-text-secondary mt-2">{description}</p>

        {/* Button Row */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="flex-1 py-2.5 border border-border-primary text-text-secondary hover:text-text-primary hover:bg-surface-overlay/30 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border-0 cursor-pointer"
          >
            {isDeleting ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader className="!flex-row !gap-1" />
                <span>Deleting...</span>
              </span>
            ) : (
              'Delete'
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
