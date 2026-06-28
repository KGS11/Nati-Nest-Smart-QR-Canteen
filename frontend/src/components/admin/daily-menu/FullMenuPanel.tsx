import { CategoryWithDailyStatus } from "@/types/daily-menu.types";
import { FullMenuItemCard } from "./FullMenuItemCard";
import { useState } from "react";

interface FullMenuPanelProps {
  categories: CategoryWithDailyStatus[];
  onAddItem: (menuItemId: string) => Promise<void>;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  allCategoryList: Array<{ id: string; name: string }>;
}

export function FullMenuPanel({
  categories,
  onAddItem,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onCategorySelect,
  allCategoryList,
}: FullMenuPanelProps) {
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAdd = async (menuItemId: string) => {
    setAddingId(menuItemId);
    try {
      await onAddItem(menuItemId);
    } catch (err) {
      // Store handles error state
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-base border border-surface-raised rounded-2xl overflow-hidden p-5">
      <div className="flex items-center justify-between mb-4 border-b border-surface-raised pb-3">
        <h3 className="text-lg font-bold text-text-primary">Master Catalogue</h3>
        <span className="text-xs text-text-tertiary font-medium">Add items to today's menu</span>
      </div>

      <div className="space-y-4 mb-5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search catalogue items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-surface-raised border border-border-primary rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-2.5 text-text-tertiary hover:text-text-primary bg-transparent border-0 cursor-pointer text-sm"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          <button
            onClick={() => onCategorySelect(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer border transition-all ${
              selectedCategoryId === null
                ? "bg-accent-500 border-accent-500 text-surface-base font-bold"
                : "bg-surface-raised border-border-primary text-text-secondary hover:text-text-primary"
            }`}
          >
            All
          </button>
          {allCategoryList.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer border transition-all ${
                selectedCategoryId === cat.id
                  ? "bg-accent-500 border-accent-500 text-surface-base font-bold"
                  : "bg-surface-raised border-border-primary text-text-secondary hover:text-text-primary"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-text-tertiary font-medium">
          <span className="animate-spin mr-2">⏳</span> Loading Catalogue...
        </div>
      ) : categories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border border-dashed border-border-primary rounded-xl px-4">
          <span className="text-4xl text-text-muted mb-3">🔍</span>
          <h4 className="font-bold text-text-primary text-base">No Items Found</h4>
          <p className="text-xs text-text-tertiary max-w-[280px] mt-1">
            Try adjusting your search query or selecting a different category.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6 max-h-[500px] pr-1.5 scrollbar-thin">
          {categories.map((category) => (
            <div key={category.id} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary bg-surface-raised/40 px-2.5 py-1 rounded border border-border-primary/30">
                {category.name}
              </h4>
              <div className="grid gap-3">
                {category.items.map((item) => (
                  <FullMenuItemCard
                    key={item.id}
                    item={item}
                    onAdd={() => handleAdd(item.id)}
                    isAdding={addingId === item.id}
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
