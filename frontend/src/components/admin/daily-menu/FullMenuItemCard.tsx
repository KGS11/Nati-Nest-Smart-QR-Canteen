import { MenuItemWithStatus } from "@/types/daily-menu.types";
import { getValidImageUrl } from "@/utils/imageUrl";

interface FullMenuItemCardProps {
  item: MenuItemWithStatus;
  onAdd: () => void;
  isAdding: boolean;
}

export function FullMenuItemCard({ item, onAdd, isAdding }: FullMenuItemCardProps) {
  const imageUrl = getValidImageUrl(item.imageUrl);

  return (
    <div className="flex items-center gap-4 bg-surface-raised border border-border-primary p-4 rounded-xl hover:border-border-secondary transition-all select-none group">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-overlay shrink-0 flex items-center justify-center border border-border-primary relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xl font-bold text-text-tertiary">
            {item.name.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-text-primary truncate group-hover:text-accent-400 transition-colors">
            {item.name}
          </h4>
          {item.isPopular && (
            <span className="bg-accent-500/10 text-accent-500 border border-accent-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase shrink-0">
              Popular
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary mt-1 line-clamp-1">
          {item.description || "No description provided."}
        </p>
        <div className="text-sm font-bold text-accent-500 mt-2">
          ₹{item.price.toFixed(2)}
        </div>
      </div>

      {item.isOnTodaysMenu ? (
        <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0 flex items-center gap-1.5">
          <span>✓</span> Added
        </span>
      ) : (
        <button
          type="button"
          disabled={isAdding}
          onClick={onAdd}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-overlay hover:bg-accent-500 hover:text-surface-base text-text-secondary border border-border-secondary hover:border-accent-500 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed min-h-10"
        >
          {isAdding ? (
            <span className="inline-block animate-spin">⏳</span>
          ) : (
            <span className="font-bold text-sm leading-none">+</span>
          )}
          Add
        </button>
      )}
    </div>
  );
}
