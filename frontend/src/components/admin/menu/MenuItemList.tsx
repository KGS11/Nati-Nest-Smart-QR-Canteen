'use client'

import { useEffect, useState } from 'react'
import { useMenuStore } from '@/stores/menuStore'
import apiClient from '@/lib/api-client'
import PageHeader from '../shared/PageHeader'
import EmptyState from '../shared/EmptyState'
import SearchBar from '../shared/SearchBar'
import Pagination from '../shared/Pagination'
import MenuItemCard from './MenuItemCard'
import MenuItemForm from './MenuItemForm'
import DeleteConfirmModal from './DeleteConfirmModal'
import { Toast } from '@/components/ui/Toast'
import { MenuItem } from '@/types/menu.types'

interface ActiveToast {
  id: string
  title: string
  tone: 'success' | 'error' | 'info'
}

export default function MenuItemList() {
  const store = useMenuStore()
  const [toasts, setToasts] = useState<ActiveToast[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const addToast = (title: string, tone: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const fetchItems = async () => {
    store.setLoadingItems(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(store.currentPage))
      params.append('limit', '12')
      if (store.searchQuery) params.append('search', store.searchQuery)
      if (store.selectedCategoryId)
        params.append('category', store.selectedCategoryId)

      const res = await apiClient.get(`/menu-items?${params}`)
      const items = res.data?.data?.items || res.data?.items || []
      const pagination = res.data?.data?.pagination || res.data?.pagination || null
      
      store.setMenuItems(items)
      if (pagination) {
        store.setPagination(pagination)
      }
    } catch (err: any) {
      addToast(err?.message || 'Failed to load menu items.', 'error')
    } finally {
      store.setLoadingItems(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories')
      const categoriesList = res.data?.data?.categories || res.data?.data || res.data || []
      store.setCategories(categoriesList)
    } catch (err: any) {
      addToast(err?.message || 'Failed to load categories.', 'error')
    }
  }

  // Fetch items on filters change
  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.searchQuery, store.selectedCategoryId, store.currentPage])

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleAvailability = async (id: string) => {
    const item = store.menuItems.find((i) => i.id === id)
    if (!item) return

    const previousItems = store.menuItems
    // Optimistic Update
    const updatedItem = { ...item, isAvailable: !item.isAvailable }
    store.updateMenuItem(updatedItem)

    try {
      await apiClient.patch(`/menu-items/${id}/availability`, {
        isAvailable: updatedItem.isAvailable
      })
      addToast(
        `Item "${updatedItem.name}" is now ${updatedItem.isAvailable ? 'available' : 'unavailable'}`,
        'success'
      )
    } catch (err: any) {
      store.setMenuItems(previousItems)
      addToast(err?.message || 'Failed to toggle item availability.', 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (store.activeModal?.type !== 'deleteItem') return
    const { item } = store.activeModal
    setIsDeleting(true)
    try {
      await apiClient.delete(`/menu-items/${item.id}`)
      store.removeMenuItem(item.id)
      addToast('Item deleted successfully', 'success')
      store.closeModal()
    } catch (err: any) {
      addToast(err?.message || 'Failed to delete item.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateSuccess = (newItem: MenuItem) => {
    // Add to items list and re-fetch to ensure pagination/sorting syncs correctly
    store.addMenuItem(newItem)
    store.closeModal()
    addToast('Menu item created', 'success')
    fetchItems()
  }

  const handleEditSuccess = (updatedItem: MenuItem) => {
    store.updateMenuItem(updatedItem)
    store.closeModal()
    addToast('Menu item updated', 'success')
  }

  const handlePageChange = (page: number) => {
    store.setCurrentPage(page)
  }

  const handleSearchChange = (query: string) => {
    store.setSearchQuery(query)
  }

  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null
    store.setSelectedCategoryId(value)
  }

  const totalItemsCount = store.pagination?.total ?? 0

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-6 overflow-y-auto">
      {/* Page Header */}
      <PageHeader
        title="Menu Items"
        subtitle={`${totalItemsCount} items`}
        action={{
          label: 'Add Item',
          onClick: () => store.openModal({ type: 'createItem' })
        }}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 shrink-0">
        <SearchBar
          value={store.searchQuery}
          onChange={handleSearchChange}
          placeholder="Search items..."
          className="flex-1"
        />

        <select
          value={store.selectedCategoryId ?? ''}
          onChange={handleCategoryFilterChange}
          className="bg-zinc-900 border border-zinc-800 text-zinc-105 rounded-xl px-3 py-2 h-10 w-full sm:w-48 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-sm transition-colors cursor-pointer"
        >
          <option value="">All Categories</option>
          {store.categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Loading Skeletons */}
      {store.isLoadingItems && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, idx) => (
            <div
              key={idx}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse"
            >
              <div className="h-40 bg-zinc-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-1/3" />
                <div className="h-5 bg-zinc-800 rounded w-2/3" />
                <div className="h-4 bg-zinc-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!store.isLoadingItems && store.menuItems.length === 0 && (
        <EmptyState
          icon="🍽️"
          title={store.searchQuery ? 'No items found' : 'No items yet'}
          description={
            store.searchQuery
              ? 'Try a different search or clear the filters'
              : 'Add your first menu item to get started'
          }
          action={
            !store.searchQuery
              ? {
                  label: 'Add Item',
                  onClick: () => store.openModal({ type: 'createItem' })
                }
              : undefined
          }
        />
      )}

      {/* Items Grid */}
      {!store.isLoadingItems && store.menuItems.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1">
            {store.menuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={(i) => store.openModal({ type: 'editItem', item: i })}
                onDelete={(i) => store.openModal({ type: 'deleteItem', item: i })}
                onToggleAvailability={handleToggleAvailability}
              />
            ))}
          </div>

          {/* Pagination */}
          {store.pagination && store.pagination.totalPages > 1 && (
            <Pagination
              pagination={store.pagination}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* MenuItem Form Modals */}
      {(store.activeModal?.type === 'createItem' ||
        store.activeModal?.type === 'editItem') && (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl my-8">
            <button
              type="button"
              onClick={store.closeModal}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-bold text-zinc-100 mb-4">
              {store.activeModal.type === 'createItem' ? 'Add Menu Item' : 'Edit Menu Item'}
            </h2>
            <MenuItemForm
              item={
                store.activeModal.type === 'editItem'
                  ? store.activeModal.item
                  : undefined
              }
              categories={store.categories}
              onSuccess={
                store.activeModal.type === 'createItem'
                  ? handleCreateSuccess
                  : handleEditSuccess
              }
              onCancel={store.closeModal}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {store.activeModal?.type === 'deleteItem' && (
        <DeleteConfirmModal
          title="Delete Menu Item"
          description="Are you sure you want to delete this menu item? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={store.closeModal}
          isDeleting={isDeleting}
        />
      )}

      {/* Stacked Toast Messages */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => (
          <div key={toast.id} className="relative group">
            <Toast title={toast.title} tone={toast.tone} />
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-200 text-xs bg-transparent border-0 cursor-pointer font-bold p-1 leading-none"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
