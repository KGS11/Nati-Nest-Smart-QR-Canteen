"use client";

import { DailyMenuItem, DailyMenuRemovalReason } from "@/types/daily-menu.types";
import { DailyMenuItemCard } from "./DailyMenuItemCard";
import { useState } from "react";
import { getValidImageUrl } from "@/utils/imageUrl";

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
        return { label: "Kitchen Closed", style: "bg-surface-overlay/40 text-text-tertiary border-border-primary" };
      default:
        return { label: "Removed", style: "bg-surface-overlay/20 text-text-tertiary border-border-primary" };
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
    <div className="flex flex-col h-full bg-surface-base border border-surface-raised rounded-2xl overflow-hidden p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4 border-b border-surface-raised pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Daily Session Menu</h3>
          <span className="bg-surface-raised border border-border-primary px-2.5 py-1 rounded-full text-xs font-bold text-accent-500 font-mono">
            {items.length} Active Today
          </span>
        </div>

        {/* Sub tabs */}
        <div className="flex bg-surface-raised/50 p-1 rounded-xl border border-border-primary/50">
          <button
            type="button"
            onClick={() => setSubTab("active")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "active"
                ? "bg-surface-overlay text-text-primary shadow"
                : "text-text-secondary hover:text-text-primary bg-transparent"
            }`}
          >
            Active ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("removed")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === "removed"
                ? "bg-surface-overlay text-red-400 border border-red-500/10 shadow"
                : "text-text-tertiary hover:text-text-primary bg-transparent"
            }`}
          >
            Removed ({removedItems.length})
          </button>
        </div>
      </div>

      {subTab === "active" ? (
        // Active Sub-panel
        isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-text-tertiary font-medium">
            <span className="animate-spin mr-2">⏳</span> Loading Today's Menu...
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border border-dashed border-border-primary rounded-xl px-4 select-none">
            <span className="text-4xl text-text-muted mb-3">🪭</span>
            <h4 className="font-bold text-text-primary text-base">Your Daily Menu is Empty</h4>
            <p className="text-xs text-text-tertiary max-w-[280px] mt-1">
              Choose items from the master catalog to make them available for today's orders.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 max-h-[600px] pr-1.5 scrollbar-thin">
            {activeCategories.map((category) => (
              <div key={category} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary bg-surface-raised/40 px-2.5 py-1 rounded border border-border-primary/30">
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
          <div className="flex-1 flex items-center justify-center py-20 text-text-tertiary font-medium">
            <span className="animate-spin mr-2">⏳</span> Loading Removed Items...
          </div>
        ) : removedItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border border-dashed border-border-primary rounded-xl px-4 select-none">
            <span className="text-4xl text-text-muted mb-3">🛡️</span>
            <h4 className="font-bold text-text-secondary text-base">No Removed Items</h4>
            <p className="text-xs text-text-tertiary max-w-[280px] mt-1">
              Items deactivated during today's service will appear here for audit logging and restoration.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[600px] pr-1.5 scrollbar-thin">
            {removedItems.map((item) => {
              const badge = getReasonBadge(item.removalReasonType);
              const imageUrl = getValidImageUrl(item.imageUrl);
              return (
                <div
                  key={item.dailyMenuId}
                  className="flex flex-col gap-3 bg-surface-raised/30 border border-surface-raised hover:border-border-primary p-4 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Tiny thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-overlay shrink-0 flex items-center justify-center border border-border-primary">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.name} className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <span className="text-sm font-bold text-text-muted">{item.name.charAt(0)}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-text-secondary truncate text-sm line-through decoration-border-secondary">
                          {item.name}
                        </h5>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase shrink-0 ${badge.style}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-0.5 font-medium">
                        Category: {item.category.name}
                      </p>
                    </div>

                    {/* Restore button */}
                    <button
                      type="button"
                      disabled={restoringId === item.dailyMenuId}
                      onClick={() => handleRestore(item.dailyMenuId)}
                      className="px-3 py-1.5 rounded-lg bg-surface-overlay hover:bg-accent-500 text-text-secondary hover:text-surface-base text-xs font-bold border border-border-secondary hover:border-accent-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 min-h-[32px] flex items-center justify-center"
                    >
                      {restoringId === item.dailyMenuId ? "Restoring..." : "Restore"}
                    </button>
                  </div>

                  {/* Audit details */}
                  {item.removalReason && (
                    <div className="bg-surface-base/60 border border-border-primary/50 p-2.5 rounded-lg text-xs">
                      <div className="flex justify-between items-center text-[10px] text-text-muted font-semibold mb-1">
                        <span>REMOVED BY: {item.removedBy?.name || "System"}</span>
                        <span>
                          {item.removedAt &&
                            new Date(item.removedAt).toLocaleTimeString("en-IN", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                        </span>
                      </div>
                      <p className="text-text-secondary font-medium italic">
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
