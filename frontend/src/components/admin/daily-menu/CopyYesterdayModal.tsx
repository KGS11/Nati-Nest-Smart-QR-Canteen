"use client";

interface CopyYesterdayModalProps {
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isCopying: boolean;
}

export function CopyYesterdayModal({
  onConfirm,
  onCancel,
  isCopying,
}: CopyYesterdayModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-surface-raised border border-border-default rounded-2xl max-w-sm w-full mx-auto mt-40 p-6 shadow-2xl relative text-center">
        
        {/* Info Icon */}
        <span className="text-3xl text-brand-500 mb-4 block" role="img" aria-label="info">
          📋
        </span>

        {/* Title */}
        <h3 className="text-display-xs font-bold text-text-primary">Copy Yesterday's Menu</h3>

        {/* Description */}
        <p className="text-body-sm text-text-tertiary mt-2">
          This will copy all active items from yesterday's session menu to today. Master catalogue retired items will be skipped automatically.
        </p>

        {/* Button Row */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={isCopying}
            onClick={onCancel}
            className="flex-1 py-2.5 border border-border-default text-text-tertiary hover:text-text-secondary hover:bg-surface-overlay rounded-xl text-label-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={isCopying}
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-400 text-brand-950 rounded-xl text-label-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border-0 cursor-pointer"
          >
            {isCopying ? (
              <span className="inline-flex items-center gap-1.5 animate-pulse">
                <span>Copying...</span>
              </span>
            ) : (
              'Confirm'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
