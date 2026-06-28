import { DailyMenuItem } from "@/types/daily-menu.types";
import { getValidImageUrl } from "@/utils/imageUrl";

interface DailyMenuItemCardProps {
  item: DailyMenuItem;
  onRemove: () => void;
  isRemoving: boolean;
}

export function DailyMenuItemCard({ item, onRemove, isRemoving }: DailyMenuItemCardProps) {
  const imageUrl = getValidImageUrl(item.imageUrl);

  return (
    <div className="flex items-center gap-4 bg-surface-raised border border-border-default p-4 rounded-xl hover:border-border-hover transition-all select-none group">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-overlay shrink-0 flex items-center justify-center border border-border-default relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-display-xs font-bold text-text-tertiary">
            {item.name.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-text-primary truncate group-hover:text-brand-500 transition-colors text-body-md">
            {item.name}
          </h4>
          {item.isPopular && (
            <span className="bg-brand-500/10 text-brand-500 border border-brand-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase shrink-0">
              Popular
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-body-xs text-text-tertiary mt-0.5 font-medium">
          <span>{item.category.name}</span>
          <span>•</span>
          <span className="text-brand-500 font-bold">₹{item.price.toFixed(2)}</span>
        </div>

        <div className="text-[10px] text-text-tertiary mt-2 flex flex-wrap gap-x-2">
          <span>Added by: <strong className="text-text-secondary font-semibold">{item.addedBy.name}</strong></span>
          <span>•</span>
          <span>{new Date(item.addedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span>
        </div>
      </div>

      <button
        type="button"
        disabled={isRemoving}
        onClick={onRemove}
        className="w-10 h-10 rounded-xl bg-surface-overlay hover:bg-semantic_error-500/10 border border-border-default hover:border-semantic_error-500/30 text-text-tertiary hover:text-semantic_error-400 flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Remove from today's menu"
      >
        {isRemoving ? (
          <span className="inline-block animate-spin text-label-sm">⏳</span>
        ) : (
          <span className="text-body-md">✕</span>
        )}
      </button>
    </div>
  );
}
