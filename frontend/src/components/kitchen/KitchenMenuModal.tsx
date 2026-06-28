'use client'

import { useState, useEffect } from 'react'
import { useDailyMenu } from '@/hooks/useDailyMenu'
import { RemoveItemModal } from '@/components/admin/daily-menu/RemoveItemModal'
import { DailyMenuRemovalReason, CategoryWithDailyStatus, MenuItemWithStatus } from '@/types/daily-menu.types'
import { cn } from '@/utils/cn'

interface KitchenMenuModalProps {
  onClose: () => void
}

export default function KitchenMenuModal({ onClose }: KitchenMenuModalProps) {
  const {
    todaysItems,
    removedItems,
    fullMenuCategories,
    isLoadingToday,
    isLoadingRemoved,
    isLoadingFull,
    addItemToToday,
    removeItemFromToday,
    restoreItem,
    fetchTodayMenu,
    fetchRemovedItems,
    fetchFullMenu,
  } = useDailyMenu()

  const [activeTab, setActiveTab] = useState<'active' | 'unavailable' | 'add'>('active')
  const [deactivatingItem, setDeactivatingItem] = useState<{ id: string; name: string } | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTodayMenu()
    fetchRemovedItems()
    fetchFullMenu()
  }, [fetchTodayMenu, fetchRemovedItems, fetchFullMenu])

  const handleRemoveClick = (menuItemId: string, itemName: string) => {
    setDeactivatingItem({ id: menuItemId, name: itemName })
  }

  const handleRemoveConfirm = async (reason: string, reasonType: DailyMenuRemovalReason) => {
    if (!deactivatingItem) return
    setIsDeactivating(true)
    try {
      await removeItemFromToday(deactivatingItem.id, reason, reasonType)
      setDeactivatingItem(null)
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleAddItem = async (menuItemId: string) => {
    try {
      await addItemToToday(menuItemId)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRestoreItem = async (dailyMenuId: string) => {
    try {
      await restoreItem(dailyMenuId)
    } catch (err) {
      console.error(err)
    }
  }

  // Filter full catalog items by search query
  const filteredCatalog = fullMenuCategories.map((cat: CategoryWithDailyStatus) => {
    const items = cat.items.filter((item: MenuItemWithStatus) => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !todaysItems.some(today => today.menuItemId === item.id)
    )
    return { ...cat, items }
  }).filter(cat => cat.items.length > 0)

  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-surface-base border border-border-default rounded-3xl max-w-2xl w-full mx-auto mt-10 p-6 shadow-2xl relative flex flex-col gap-6 max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-border-default pb-4 shrink-0">
          <div>
            <h2 className="text-display-xs font-bold text-text-primary flex items-center gap-2">
              <span>📋</span> Menu Availability Control
            </h2>
            <p className="text-label-xs text-text-tertiary mt-1">
              Deactivate items when out of stock or restore them when prepared
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary text-display-sm font-bold bg-transparent border-0 cursor-pointer leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-surface-raised p-1 rounded-2xl border border-border-default shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-label-xs font-bold transition-all",
              activeTab === 'active'
                ? "bg-surface-base text-text-primary shadow"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            Available ({todaysItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unavailable')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-label-xs font-bold transition-all",
              activeTab === 'unavailable'
                ? "bg-semantic_error-500/10 border border-semantic_error-500/20 text-semantic_error-400 shadow"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            Unavailable ({removedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-label-xs font-bold transition-all",
              activeTab === 'add'
                ? "bg-brand-500 text-brand-950 font-extrabold shadow"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            Add items to Today's Menu
          </button>
        </div>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[300px] scrollbar-thin">
          {activeTab === 'active' && (
            <div className="space-y-4">
              {isLoadingToday ? (
                <p className="text-center text-label-xs text-text-tertiary py-12">Loading menu items...</p>
              ) : todaysItems.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border-default rounded-2xl">
                  <p className="text-label-sm font-semibold text-text-tertiary">No items available on Today's Menu</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {todaysItems.map((item) => (
                    <div
                      key={item.dailyMenuId}
                      className="bg-surface-raised/40 border border-border-default p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-border-hover transition-all"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-text-secondary truncate text-label-sm">{item.name}</p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">Category: {item.category.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveClick(item.menuItemId, item.name)}
                        className="px-3 py-1.5 rounded-lg border border-semantic_error-500/20 text-semantic_error-400 bg-semantic_error-500/10 hover:bg-semantic_error-500/20 text-label-xs font-semibold transition-colors shrink-0"
                      >
                        Set Unavailable
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'unavailable' && (
            <div className="space-y-4">
              {isLoadingRemoved ? (
                <p className="text-center text-label-xs text-text-tertiary py-12">Loading unavailable items...</p>
              ) : removedItems.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border-default rounded-2xl">
                  <p className="text-label-sm font-semibold text-text-tertiary">No unavailable items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {removedItems.map((item) => (
                    <div
                      key={item.dailyMenuId}
                      className="bg-surface-raised/40 border border-border-default p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-border-hover transition-all"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-text-tertiary line-through truncate text-label-sm">{item.name}</p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">
                          Reason: {item.removalReason || item.removalReasonType || 'Out of stock'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreItem(item.dailyMenuId)}
                        className="px-3 py-1.5 rounded-lg border border-semantic_success-500/20 text-semantic_success-400 bg-semantic_success-500/10 hover:bg-semantic_success-500/20 text-label-xs font-semibold transition-colors shrink-0"
                      >
                        Make Available
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search master menu catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-raised border border-border-default rounded-xl px-4 py-2.5 text-label-xs text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand-500 shrink-0"
              />

              {isLoadingFull ? (
                <p className="text-center text-label-xs text-text-tertiary py-12">Loading master catalog...</p>
              ) : filteredCatalog.length === 0 ? (
                <p className="text-center text-label-xs text-text-tertiary py-12">No items found matching query</p>
              ) : (
                <div className="space-y-4">
                  {filteredCatalog.map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary bg-surface-raised/60 px-3 py-1 rounded border border-border-default/30">
                        {cat.name}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.items.map((item: MenuItemWithStatus) => (
                          <div
                            key={item.id}
                            className="bg-surface-raised/20 border border-border-default p-3 rounded-xl flex items-center justify-between gap-3 hover:border-border-hover transition-all"
                          >
                            <span className="text-label-xs font-semibold text-text-secondary truncate">{item.name}</span>
                            <button
                              type="button"
                              onClick={() => handleAddItem(item.id)}
                              className="px-2.5 py-1 rounded bg-brand-500 hover:bg-brand-400 text-brand-950 text-[10px] font-bold transition-all shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border-default pt-4 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-surface-raised hover:bg-surface-base text-text-secondary rounded-xl text-label-sm font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {deactivatingItem && (
        <RemoveItemModal
          itemName={deactivatingItem.name}
          onConfirm={handleRemoveConfirm}
          onCancel={() => setDeactivatingItem(null)}
          isSubmitting={isDeactivating}
        />
      )}
    </div>
  )
}
