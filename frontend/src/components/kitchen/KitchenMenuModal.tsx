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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full mx-auto mt-10 p-6 shadow-2xl relative flex flex-col gap-6 max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-zinc-850 pb-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <span>📋</span> Menu Availability Control
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Deactivate items when out of stock or restore them when prepared
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-850 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all",
              activeTab === 'active'
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-450 hover:text-zinc-200"
            )}
          >
            Available ({todaysItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unavailable')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all",
              activeTab === 'unavailable'
                ? "bg-red-500/10 border border-red-500/20 text-red-400 shadow"
                : "text-zinc-450 hover:text-zinc-200"
            )}
          >
            Unavailable ({removedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all",
              activeTab === 'add'
                ? "bg-amber-500 text-zinc-950 font-extrabold shadow"
                : "text-zinc-450 hover:text-zinc-200"
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
                <p className="text-center text-xs text-zinc-500 py-12">Loading menu items...</p>
              ) : todaysItems.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-sm font-semibold text-zinc-450">No items available on Today's Menu</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {todaysItems.map((item) => (
                    <div
                      key={item.dailyMenuId}
                      className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-800 transition-all"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-200 truncate text-sm">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Category: {item.category.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveClick(item.menuItemId, item.name)}
                        className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 text-xs font-semibold transition-colors shrink-0"
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
                <p className="text-center text-xs text-zinc-500 py-12">Loading unavailable items...</p>
              ) : removedItems.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-sm font-semibold text-zinc-450">No unavailable items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {removedItems.map((item) => (
                    <div
                      key={item.dailyMenuId}
                      className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-800 transition-all"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-400 line-through truncate text-sm">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Reason: {item.removalReason || item.removalReasonType || 'Out of stock'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreItem(item.dailyMenuId)}
                        className="px-3 py-1.5 rounded-lg border border-green-500/20 text-green-400 bg-green-500/5 hover:bg-green-500/10 text-xs font-semibold transition-colors shrink-0"
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
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-150 placeholder-zinc-600 focus:outline-none focus:border-amber-500 shrink-0"
              />

              {isLoadingFull ? (
                <p className="text-center text-xs text-zinc-500 py-12">Loading master catalog...</p>
              ) : filteredCatalog.length === 0 ? (
                <p className="text-center text-xs text-zinc-500 py-12">No items found matching query</p>
              ) : (
                <div className="space-y-4">
                  {filteredCatalog.map((cat) => (
                    <div key={cat.id} className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-950/60 px-3 py-1 rounded border border-zinc-850/30">
                        {cat.name}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.items.map((item: MenuItemWithStatus) => (
                          <div
                            key={item.id}
                            className="bg-zinc-950/20 border border-zinc-850 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-800 transition-all"
                          >
                            <span className="text-xs font-semibold text-zinc-200 truncate">{item.name}</span>
                            <button
                              type="button"
                              onClick={() => handleAddItem(item.id)}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-bold transition-all shrink-0"
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
        <div className="border-t border-zinc-850 pt-4 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
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
