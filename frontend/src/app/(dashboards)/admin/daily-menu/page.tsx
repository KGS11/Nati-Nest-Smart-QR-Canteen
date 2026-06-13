"use client";

import { useEffect, useState } from "react";
import { useDailyMenu } from "@/hooks/useDailyMenu";
import { DailyMenuHeader } from "@/components/admin/daily-menu/DailyMenuHeader";
import { TodaysMenuPanel } from "@/components/admin/daily-menu/TodaysMenuPanel";
import { FullMenuPanel } from "@/components/admin/daily-menu/FullMenuPanel";
import { CopyYesterdayModal } from "@/components/admin/daily-menu/CopyYesterdayModal";
import { HistoryModal } from "@/components/admin/daily-menu/HistoryModal";
import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import { useIsMobile } from "@/hooks/useMediaQuery";

export default function DailyMenuPage() {
  const {
    todaysItems,
    fullMenuCategories,
    isLoadingToday,
    isLoadingFull,
    isCopying,
    searchQuery,
    selectedCategoryId,
    error,
    setSearchQuery,
    setSelectedCategoryId,
    fetchTodayMenu,
    fetchFullMenu,
    addItemToToday,
    removeItemFromToday,
    copyYesterdayMenu,
  } = useDailyMenu();

  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "catalog">("today");
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchTodayMenu();
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
  }, [fetchTodayMenu, fetchFullMenu]);

  const handleCopyConfirm = async () => {
    try {
      await copyYesterdayMenu();
      setShowCopyModal(false);
    } catch (err) {
      // Handled in store
    }
  };

  const todayDateStr = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 pb-24 md:p-8">
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
            onRemoveItem={removeItemFromToday}
            isLoading={isLoadingToday}
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
    </div>
  );
}
