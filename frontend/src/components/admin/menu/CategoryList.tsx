'use client'

import { useEffect, useState } from 'react'
import { useMenuStore } from '@/stores/menuStore'
import apiClient from '@/lib/api-client'
import PageHeader from '../shared/PageHeader'
import EmptyState from '../shared/EmptyState'
import CategoryCard from './CategoryCard'
import CategoryForm from './CategoryForm'
import DeleteConfirmModal from './DeleteConfirmModal'
import { Toast } from '@/components/ui/Toast'
import { MenuCategory } from '@/types/menu.types'

interface ActiveToast {
  id: string
  title: string
  tone: 'success' | 'error' | 'info'
}

export default function CategoryList() {
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

  const fetchCategories = async () => {
    store.setLoadingCategories(true)
    try {
      const res = await apiClient.get('/categories')
      const categoriesList = res.data?.data?.categories || res.data?.data || res.data || []
      store.setCategories(categoriesList)
    } catch (err: any) {
      addToast(err?.message || 'Failed to load categories.', 'error')
    } finally {
      store.setLoadingCategories(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleActive = async (id: string) => {
    const category = store.categories.find((c) => c.id === id)
    if (!category) return

    const previousCategories = store.categories
    // Optimistic Update
    const updatedCategory = { ...category, isActive: !category.isActive }
    store.updateCategory(updatedCategory)

    try {
      await apiClient.put(`/categories/${id}`, {
        isActive: updatedCategory.isActive,
        name: category.name,
        sortOrder: category.sortOrder
      })
      addToast(
        `Category ${updatedCategory.isActive ? 'activated' : 'deactivated'}`,
        'success'
      )
    } catch (err: any) {
      store.setCategories(previousCategories)
      addToast(err?.message || 'Failed to toggle status.', 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (store.activeModal?.type !== 'deleteCategory') return
    const { category } = store.activeModal
    setIsDeleting(true)
    try {
      await apiClient.delete(`/categories/${category.id}`)
      store.removeCategory(category.id)
      addToast('Category deleted', 'success')
      store.closeModal()
    } catch (err: any) {
      // 400 Bad Request indicates category has items
      const isConflict = err?.status === 400 || err?.response?.status === 400
      if (isConflict) {
        addToast('Remove all items first', 'error')
      } else {
        addToast(err?.message || 'Failed to delete category.', 'error')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateSuccess = (newCategory: MenuCategory) => {
    store.addCategory(newCategory)
    store.closeModal()
    addToast('Category created', 'success')
  }

  const handleEditSuccess = (updatedCategory: MenuCategory) => {
    store.updateCategory(updatedCategory)
    store.closeModal()
    addToast('Category updated', 'success')
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-6 overflow-y-auto">
      {/* Page Header */}
      <PageHeader
        title="Menu Categories"
        subtitle={`${store.categories.length} categories`}
        action={{
          label: 'Add Category',
          onClick: () => store.openModal({ type: 'createCategory' })
        }}
      />

      {/* Skeletons loader */}
      {store.isLoadingCategories && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse"
            >
              <div className="h-5 bg-zinc-800 rounded w-3/4 mb-3" />
              <div className="h-4 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!store.isLoadingCategories && store.categories.length === 0 && (
        <EmptyState
          icon="🍽️"
          title="No categories yet"
          description="Create your first menu category"
          action={{
            label: 'Add Category',
            onClick: () => store.openModal({ type: 'createCategory' })
          }}
        />
      )}

      {/* Categories Grid */}
      {!store.isLoadingCategories && store.categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {store.categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={(c) => store.openModal({ type: 'editCategory', category: c })}
              onDelete={(c) => store.openModal({ type: 'deleteCategory', category: c })}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Form Modals */}
      {(store.activeModal?.type === 'createCategory' ||
        store.activeModal?.type === 'editCategory') && (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              type="button"
              onClick={store.closeModal}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-bold text-zinc-100 mb-4">
              {store.activeModal.type === 'createCategory' ? 'Add Category' : 'Edit Category'}
            </h2>
            <CategoryForm
              category={
                store.activeModal.type === 'editCategory'
                  ? store.activeModal.category
                  : undefined
              }
              onSuccess={
                store.activeModal.type === 'createCategory'
                  ? handleCreateSuccess
                  : handleEditSuccess
              }
              onCancel={store.closeModal}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {store.activeModal?.type === 'deleteCategory' && (
        <DeleteConfirmModal
          title="Delete Category"
          description="This cannot be undone. Remove all items from this category first."
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
