export interface MenuCategory {
  id: string
  name: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  _count?: {
    items: number
  }
}

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  createdAt: string
  category: {
    id: string
    name: string
  }
  isPopular?: boolean
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface MenuItemsResponse {
  items: MenuItem[]
  pagination: PaginationMeta
}

export interface CategoryFormData {
  name: string
  sortOrder: number
  isActive: boolean
}

export interface MenuItemFormData {
  categoryId: string
  name: string
  description: string
  price: number
  isAvailable: boolean
}
