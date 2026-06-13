import { create } from 'zustand'
import { MenuCategory, MenuItem, PaginationMeta } from '@/types/menu.types'

interface MenuState {
  categories: MenuCategory[]
  menuItems: MenuItem[]
  pagination: PaginationMeta | null
  isLoadingCategories: boolean
  isLoadingItems: boolean
  searchQuery: string
  selectedCategoryId: string | null
  currentPage: number
  activeModal:
    | { type: 'createCategory' }
    | { type: 'editCategory'; category: MenuCategory }
    | { type: 'createItem' }
    | { type: 'editItem'; item: MenuItem }
    | { type: 'deleteCategory'; category: MenuCategory }
    | { type: 'deleteItem'; item: MenuItem }
    | null

  setCategories: (categories: MenuCategory[]) => void
  addCategory: (category: MenuCategory) => void
  updateCategory: (category: MenuCategory) => void
  removeCategory: (id: string) => void

  setMenuItems: (items: MenuItem[]) => void
  setPagination: (pagination: PaginationMeta) => void
  addMenuItem: (item: MenuItem) => void
  updateMenuItem: (item: MenuItem) => void
  removeMenuItem: (id: string) => void

  setSearchQuery: (query: string) => void
  setSelectedCategoryId: (id: string | null) => void
  setCurrentPage: (page: number) => void
  setLoadingCategories: (loading: boolean) => void
  setLoadingItems: (loading: boolean) => void
  openModal: (modal: MenuState['activeModal']) => void
  closeModal: () => void
}

export const useMenuStore = create<MenuState>()(
  (set) => ({
    categories: [],
    menuItems: [],
    pagination: null,
    isLoadingCategories: false,
    isLoadingItems: false,
    searchQuery: '',
    selectedCategoryId: null,
    currentPage: 1,
    activeModal: null,

    setCategories: (categories) => set({ categories }),
    addCategory: (category) =>
      set(state => ({
        categories: [...state.categories, category]
      })),
    updateCategory: (category) =>
      set(state => ({
        categories: state.categories.map(c =>
          c.id === category.id ? category : c
        )
      })),
    removeCategory: (id) =>
      set(state => ({
        categories: state.categories.filter(c => c.id !== id)
      })),

    setMenuItems: (menuItems) => set({ menuItems }),
    setPagination: (pagination) => set({ pagination }),
    addMenuItem: (item) =>
      set(state => ({
        menuItems: [item, ...state.menuItems]
      })),
    updateMenuItem: (item) =>
      set(state => ({
        menuItems: state.menuItems.map(i =>
          i.id === item.id ? item : i
        )
      })),
    removeMenuItem: (id) =>
      set(state => ({
        menuItems: state.menuItems.filter(i => i.id !== id)
      })),

    setSearchQuery: (searchQuery) =>
      set({ searchQuery, currentPage: 1 }),
    setSelectedCategoryId: (selectedCategoryId) =>
      set({ selectedCategoryId, currentPage: 1 }),
    setCurrentPage: (currentPage) => set({ currentPage }),
    setLoadingCategories: (isLoadingCategories) =>
      set({ isLoadingCategories }),
    setLoadingItems: (isLoadingItems) =>
      set({ isLoadingItems }),
    openModal: (activeModal) => set({ activeModal }),
    closeModal: () => set({ activeModal: null })
  })
)
