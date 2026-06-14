"use client";

import { DailyMenuItem, DailyMenuRemovalReason } from "@/types/daily-menu.types";
import { DailyMenuItemCard } from "./DailyMenuItemCard";
import { useState } from "react";

interface TodaysMenuPanelProps {
  items: DailyMenuItem[];
  removedItems: DailyMenuItem[];
  onRemoveItem: (menuItemId: string, itemName: string) => void;
  onRestoreItem: (dailyMenuId: string) => Promise<void>;
  isLoading: boolean;
  isLoadingRemoved: boolean;
}

export function TodaysMenuPanel({
  items,
  removedItems,
  onRemoveItem,
  onRestoreItem,
  isLoading,
  isLoadingRemoved,
}: TodaysMenuPanelProps) {
  const [subTab, setSubTab] = useState<"active" | "removed">("active");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (dailyMenuId: string) => {
    setRestoringId(dailyMenuId);
    try {
      await onRestoreItem(dailyMenuId);
    } catch (err) {
      // Store handles error
    } finally {
      setRestoringId(null);
    }
  };

  const getReasonBadge = (type?: DailyMenuRemovalReason | null) => {
    switch (type) {
      case DailyMenuRemovalReason.OUT_OF_STOCK:
        return { label: "Out of Stock", style: "bg-red-500/10 text-red-400 border-red-500/20" };
      case DailyMenuRemovalReason.INGREDIENT_FINISHED:
        return { label: "Ingredient Finished", style: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
      case DailyMenuRemovalReason.MACHINE_PROBLEM:
        return { label: "Equipment Issue", style: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
      case DailyMenuRemovalReason.KITCHEN_CLOSED:
        return { label: "Kitchen Closed", style: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
      default:
        return { label: "Removed", style: "bg-zinc-600/10 text-zinc-400 border-zinc-650/20" };
    }
  };

  // Group active items by category
  const groupedActive = items.reduce((acc, item) => {
    const categoryName = item.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, DailyMenuItem[]>);

  const activeCategories = Object.keys(groupedActive).sort();

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4 border-b border-zinc-900 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-200">Daily Session Menu</h3>
          <span className="bg-zinc-900 border border-zinc-850 px-2.5 py-1 rounded-full text-xs font-bold text-amber-500 font-mono">
            {items.length} Active Today
          </span>
        </div>

        {/* Sub tabs */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-850/50">
          <button
            type="button"
            onClick={() => setSubTab("active")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "active"
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-400 hover:text-zinc-200 bg-transparent"
            }`}
          >
            Active ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("removed")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "removed"
                ? "bg-zinc-850 text-red-400 border border-red-500/10 shadow"
                : "text-zinc-450 hover:text-zinc-200 bg-transparent"
            }`}
          >
            Removed ({removedItems.length})
          </button>
        </div>
      </div>

      {subTab === "active" ? (
        // Active Sub-panel
        isLoading ? (
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
            {activeCategories.map((category) => (
              <div key={category} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900/40 px-2.5 py-1 rounded border border-zinc-850/30">
                  {category}
                </h4>
                <div className="grid gap-3">
                  {groupedActive[category].map((item) => (
                    <DailyMenuItemCard
                      key={item.dailyMenuId}
                      item={item}
                      onRemove={() => onRemoveItem(item.menuItemId, item.name)}
                      isRemoving={false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Removed/Audit Sub-panel
        isLoadingRemoved ? (
          <div className="flex-1 flex items-center justify-center py-20 text-zinc-500 font-medium">
            <span className="animate-spin mr-2">⏳</span> Loading Removed Items...
          </div>
        ) : removedItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border border-dashed border-zinc-850 rounded-xl px-4 select-none">
            <span className="text-4xl text-zinc-700 mb-3">🛡️</span>
            <h4 className="font-bold text-zinc-400 text-base">No Removed Items</h4>
            <p className="text-xs text-zinc-500 max-w-[280px] mt-1">
              Items deactivated during today's service will appear here for audit logging and restoration.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[600px] pr-1.5 scrollbar-thin">
            {removedItems.map((item) => {
              const badge = getReasonBadge(item.removalReasonType);
              return (
                <div
                  key={item.dailyMenuId}
                  className="flex flex-col gap-3 bg-zinc-900/30 border border-zinc-900 hover:border-zinc-850 p-4 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Tiny thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-850 shrink-0 flex items-center justify-center border border-zinc-800">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <span className="text-sm font-bold text-zinc-600">{item.name.charAt(0)}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-zinc-400 truncate text-sm line-through decoration-zinc-700">
                          {item.name}
                        </h5>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase shrink-0 ${badge.style}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-650 mt-0.5 font-medium">
                        Category: {item.category.name}
                      </p>
                    </div>

                    {/* Restore button */}
                    <button
                      type="button"
                      disabled={restoringId === item.dailyMenuId}
                      onClick={() => handleRestore(item.dailyMenuId)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500 text-zinc-350 hover:text-zinc-950 text-xs font-bold border border-zinc-750 hover:border-amber-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 min-h-[32px] flex items-center justify-center"
                    >
                      {restoringId === item.dailyMenuId ? "Restoring..." : "Restore"}
                    </button>
                  </div>

                  {/* Audit details */}
                  {item.removalReason && (
                    <div className="bg-zinc-950/60 border border-zinc-850/50 p-2.5 rounded-lg text-xs">
                      <div className="flex justify-between items-center text-[10px] text-zinc-550 font-semibold mb-1">
                        <span>REMOVED BY: {item.removedBy?.name || "System"}</span>
                        <span>
                          {item.removedAt &&
                            new Date(item.removedAt).toLocaleTimeString("en-IN", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                        </span>
                      </div>
                      <p className="text-zinc-300 font-medium italic">
                        "{item.removalReason}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
