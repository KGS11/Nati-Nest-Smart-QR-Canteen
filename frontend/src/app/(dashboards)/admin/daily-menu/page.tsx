"use client";

import { useEffect, useState } from "react";
import { useDailyMenu } from "@/hooks/useDailyMenu";
import { DailyMenuHeader } from "@/components/admin/daily-menu/DailyMenuHeader";
import { TodaysMenuPanel } from "@/components/admin/daily-menu/TodaysMenuPanel";
import { FullMenuPanel } from "@/components/admin/daily-menu/FullMenuPanel";
import { CopyYesterdayModal } from "@/components/admin/daily-menu/CopyYesterdayModal";
import { HistoryModal } from "@/components/admin/daily-menu/HistoryModal";
import { RemoveItemModal } from "@/components/admin/daily-menu/RemoveItemModal";
import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { DailyMenuRemovalReason } from "@/types/daily-menu.types";

export default function DailyMenuPage() {
  const {
    todaysItems,
    removedItems,
    fullMenuCategories,
    isLoadingToday,
    isLoadingRemoved,
    isLoadingFull,
    isCopying,
    searchQuery,
    selectedCategoryId,
    error,
    setSearchQuery,
    setSelectedCategoryId,
    fetchTodayMenu,
    fetchRemovedItems,
    fetchFullMenu,
    addItemToToday,
    removeItemFromToday,
    restoreItem,
    copyYesterdayMenu,
  } = useDailyMenu();

  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // State for deactivating item modal
  const [deactivatingItem, setDeactivatingItem] = useState<{ id: string; name: string } | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [activeTab, setActiveTab] = useState<"today" | "catalog">("today");
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchTodayMenu();
    fetchRemovedItems();
    fetchFullMenu();

    const loadCategories = async () => {
      try {
        const response = await apiClient.get<ApiResponse<any[]>>("/categories");
        setAllCategories(response.data.data.map(c => ({ id: c.id, name: c.name })));
      } catch (err) {
        // Fallback or handle error silently
      }
    };
    loadCategories();
  }, [fetchTodayMenu, fetchRemovedItems, fetchFullMenu]);

  const handleCopyConfirm = async () => {
    try {
      await copyYesterdayMenu();
      setShowCopyModal(false);
    } catch (err) {
      // Handled in store
    }
  };

  const handleRemoveClick = (menuItemId: string, itemName: string) => {
    setDeactivatingItem({ id: menuItemId, name: itemName });
  };

  const handleRemoveConfirm = async (reason: string, reasonType: DailyMenuRemovalReason) => {
    if (!deactivatingItem) return;
    setIsDeactivating(true);
    try {
      await removeItemFromToday(deactivatingItem.id, reason, reasonType);
      setDeactivatingItem(null);
    } catch (err) {
      // Store handles error state
    } finally {
      setIsDeactivating(false);
    }
  };

  const todayDateStr = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 pb-24 md:p-8 animate-in fade-in duration-200">
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold flex items-center justify-between animate-pulse">
          <span>{error}</span>
        </div>
      )}

      <DailyMenuHeader
        dateString={todayDateStr}
        totalItems={todaysItems.length}
        onCopyClick={() => setShowCopyModal(true)}
        isCopyDisabled={isCopying || todaysItems.length > 0}
        isCopying={isCopying}
        onHistoryClick={() => setShowHistoryModal(true)}
      />

      {isMobile && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("today")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
              activeTab === "today"
                ? "bg-amber-500 border-amber-500 text-zinc-950"
                : "bg-zinc-900 border-zinc-800 text-zinc-400"
            }`}
          >
            Active Today ({todaysItems.length})
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
              activeTab === "catalog"
                ? "bg-amber-500 border-amber-500 text-zinc-950"
                : "bg-zinc-900 border-zinc-800 text-zinc-400"
            }`}
          >
            Add Items
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {(!isMobile || activeTab === "today") && (
          <TodaysMenuPanel
            items={todaysItems}
            removedItems={removedItems}
            onRemoveItem={handleRemoveClick}
            onRestoreItem={restoreItem}
            isLoading={isLoadingToday}
            isLoadingRemoved={isLoadingRemoved}
          />
        )}
        {(!isMobile || activeTab === "catalog") && (
          <FullMenuPanel
            categories={fullMenuCategories}
            onAddItem={addItemToToday}
            isLoading={isLoadingFull}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={setSelectedCategoryId}
            allCategoryList={allCategories}
          />
        )}
      </div>

      {showCopyModal && (
        <CopyYesterdayModal
          onConfirm={handleCopyConfirm}
          onCancel={() => setShowCopyModal(false)}
          isCopying={isCopying}
        />
      )}

      {showHistoryModal && (
        <HistoryModal onClose={() => setShowHistoryModal(false)} />
      )}

      {deactivatingItem && (
        <RemoveItemModal
          itemName={deactivatingItem.name}
          onConfirm={handleRemoveConfirm}
          onCancel={() => setDeactivatingItem(null)}
          isSubmitting={isDeactivating}
        />
      )}
    </div>
  );
}
