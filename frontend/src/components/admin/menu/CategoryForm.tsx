'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import apiClient from '@/lib/api-client'
import { MenuCategory } from '@/types/menu.types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Loader from '@/components/ui/Loader'

interface CategoryFormProps {
  category?: MenuCategory
  onSuccess: (category: MenuCategory) => void
  onCancel: () => void
}

const schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .trim(),
  sortOrder: z
    .number()
    .int('Sort order must be an integer')
    .min(0, 'Sort order must be 0 or more'),
  isActive: z.boolean()
})

type CategoryFormValues = z.infer<typeof schema>

export default function CategoryForm({
  category,
  onSuccess,
  onCancel
}: CategoryFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      sortOrder: category?.sortOrder ?? 0,
      isActive: category?.isActive ?? true
    }
  })

  const onSubmit = async (data: CategoryFormValues) => {
    setServerError(null)
    try {
      let res
      if (category) {
        res = await apiClient.put(`/categories/${category.id}`, data)
      } else {
        res = await apiClient.post('/categories', data)
      }

      const savedCategory = res.data?.data?.category || res.data?.data || res.data
      onSuccess(savedCategory)
    } catch (err: any) {
      if (err.status === 409 || err.response?.status === 409) {
        setServerError('Category name already exists')
      } else {
        setServerError(err.message || 'An error occurred while saving the category.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Category Name */}
      <Input
        label="Category Name"
        error={errors.name?.message}
        placeholder="e.g. Desserts"
        {...register('name')}
      />

      {/* Sort Order */}
      <div>
        <Input
          type="number"
          label="Display Order"
          error={errors.sortOrder?.message}
          placeholder="0"
          {...register('sortOrder', { valueAsNumber: true })}
        />
        <p className="text-body-xs text-text-tertiary mt-1.5 ml-0.5">
          Lower numbers appear first
        </p>
      </div>

      {/* Active Status Checkbox */}
      <div className="flex items-start gap-3 pt-2">
        <input
          type="checkbox"
          id="isActive"
          {...register('isActive')}
          className="mt-1 h-4 w-4 rounded border-border-primary bg-surface-base text-accent-500 focus:ring-accent-500/20 accent-accent-500"
        />
        <div className="flex flex-col">
          <label htmlFor="isActive" className="text-sm font-semibold text-text-primary cursor-pointer">
            Category is active
          </label>
          <span className="text-xs text-text-tertiary mt-0.5">
            Inactive categories are hidden from the menu
          </span>
        </div>
      </div>

      {/* Server Error Message */}
      {serverError && (
        <p className="text-body-sm text-semantic_error-400 font-semibold pt-1">
          {serverError}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-accent-500 hover:bg-accent-400 text-surface-base font-bold min-h-11 border-0"
        >
          {isSubmitting ? (
            <Loader className="!flex-row !gap-1" />
          ) : category ? (
            'Save Changes'
          ) : (
            'Create Category'
          )}
        </Button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full py-2.5 border border-border-primary text-text-secondary hover:text-text-primary hover:bg-surface-overlay/30 rounded-xl text-sm font-semibold transition-colors bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
