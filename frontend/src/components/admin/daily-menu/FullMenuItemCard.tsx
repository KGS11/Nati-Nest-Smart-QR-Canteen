import { MenuItemWithStatus } from "@/types/daily-menu.types";

interface FullMenuItemCardProps {
  item: MenuItemWithStatus;
  onAdd: () => void;
  isAdding: boolean;
}

export function FullMenuItemCard({ item, onAdd, isAdding }: FullMenuItemCardProps) {
  return (
    <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-850 p-4 rounded-xl hover:border-zinc-700/60 transition-all select-none group">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-850 shrink-0 flex items-center justify-center border border-zinc-800 relative">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xl font-bold text-zinc-500">
            {item.name.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-zinc-100 truncate group-hover:text-amber-400 transition-colors">
            {item.name}
          </h4>
          {item.isPopular && (
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase shrink-0">
              Popular
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
          {item.description || "No description provided."}
        </p>
        <div className="text-sm font-bold text-amber-500 mt-2">
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
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 border border-zinc-700 hover:border-amber-500 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed min-h-10"
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
