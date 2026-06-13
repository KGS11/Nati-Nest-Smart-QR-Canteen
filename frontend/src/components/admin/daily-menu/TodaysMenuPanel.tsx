import { DailyMenuItem } from "@/types/daily-menu.types";
import { DailyMenuItemCard } from "./DailyMenuItemCard";
import { useState } from "react";

interface TodaysMenuPanelProps {
  items: DailyMenuItem[];
  onRemoveItem: (menuItemId: string) => Promise<void>;
  isLoading: boolean;
}

export function TodaysMenuPanel({ items, onRemoveItem, isLoading }: TodaysMenuPanelProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (menuItemId: string) => {
    setRemovingId(menuItemId);
    try {
      await onRemoveItem(menuItemId);
    } catch (err) {
      // Store handles error logging
    } finally {
      setRemovingId(null);
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    const categoryName = item.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, DailyMenuItem[]>);

  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden p-5">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3">
        <h3 className="text-lg font-bold text-zinc-200">Today's Menu Selection</h3>
        <span className="bg-zinc-900 border border-zinc-850 px-2.5 py-1 rounded-full text-xs font-bold text-amber-500">
          {items.length} Active
        </span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-zinc-500 font-medium">
          <span className="animate-spin mr-2">⏳</span> Loading Today's Menu...
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border border-dashed border-zinc-850 rounded-xl px-4 select-none">
          <span className="text-4xl text-zinc-600 mb-3">🫙</span>
          <h4 className="font-bold text-zinc-300 text-base">Your Daily Menu is Empty</h4>
          <p className="text-xs text-zinc-500 max-w-[280px] mt-1">
            Choose items from the master catalog to make them available for today's orders.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6 max-h-[600px] pr-1.5 scrollbar-thin">
          {categories.map((category) => (
            <div key={category} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900/40 px-2.5 py-1 rounded border border-zinc-850/30">
                {category}
              </h4>
              <div className="grid gap-3">
                {groupedItems[category].map((item) => (
                  <DailyMenuItemCard
                    key={item.dailyMenuId}
                    item={item}
                    onRemove={() => handleRemove(item.menuItemId)}
                    isRemoving={removingId === item.menuItemId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
