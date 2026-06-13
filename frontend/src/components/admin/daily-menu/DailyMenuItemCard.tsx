import { DailyMenuItem } from "@/types/daily-menu.types";

interface DailyMenuItemCardProps {
  item: DailyMenuItem;
  onRemove: () => void;
  isRemoving: boolean;
}

export function DailyMenuItemCard({ item, onRemove, isRemoving }: DailyMenuItemCardProps) {
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
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5 font-medium">
          <span>{item.category.name}</span>
          <span>•</span>
          <span className="text-amber-500 font-bold">₹{item.price.toFixed(2)}</span>
        </div>

        <div className="text-[10px] text-zinc-500 mt-2 flex flex-wrap gap-x-2">
          <span>Added by: <strong className="text-zinc-400 font-semibold">{item.addedBy.name}</strong></span>
          <span>•</span>
          <span>{new Date(item.addedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span>
        </div>
      </div>

      <button
        type="button"
        disabled={isRemoving}
        onClick={onRemove}
        className="w-10 h-10 rounded-xl bg-zinc-850 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Remove from today's menu"
      >
        {isRemoving ? (
          <span className="inline-block animate-spin text-sm">⏳</span>
        ) : (
          <span className="text-lg">✕</span>
        )}
      </button>
    </div>
  );
}
