'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import apiClient from '@/lib/api-client'
import { MenuItem, MenuCategory } from '@/types/menu.types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Loader from '@/components/ui/Loader'
import ImageUpload from './ImageUpload'

interface MenuItemFormProps {
  item?: MenuItem
  categories: MenuCategory[]
  onSuccess: (item: MenuItem) => void
  onCancel: () => void
}

const schema = z.object({
  categoryId: z.string().uuid('Please select a category'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .trim(),
  description: z
    .string()
    .max(300, 'Description too long')
    .trim()
    .optional()
    .or(z.literal('')),
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0'),
  isAvailable: z.boolean()
})

type MenuItemFormValues = z.infer<typeof schema>

export default function MenuItemForm({
  item,
  categories,
  onSuccess,
  onCancel
}: MenuItemFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [currentImg, setCurrentImg] = useState<string | null>(item?.imageUrl ?? null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: item?.categoryId ?? '',
      name: item?.name ?? '',
      description: item?.description ?? '',
      price: item?.price ?? 0,
      isAvailable: item?.isAvailable ?? true
    }
  })

  const onSubmit = async (data: MenuItemFormValues) => {
    setServerError(null)
    try {
      const formData = new FormData()
      formData.append('categoryId', data.categoryId)
      formData.append('name', data.name)
      formData.append('price', String(data.price))
      formData.append('description', data.description || '')
      formData.append('isAvailable', String(data.isAvailable))

      if (imageFile) {
        formData.append('image', imageFile)
      } else if (currentImg === null) {
        // If image was cleared, let backend know to remove it
        formData.append('removeImage', 'true')
      }

      let res
      if (item) {
        res = await apiClient.put(`/menu-items/${item.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        res = await apiClient.post('/menu-items', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      const savedItem = res.data?.data?.item || res.data?.data || res.data
      onSuccess(savedItem)
    } catch (err: any) {
      setServerError(err.message || 'An error occurred while saving the menu item.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Category Select */}
      <div className="block space-y-2 text-left">
        <label htmlFor="categoryId" className="text-label-sm text-text-primary">
          Category
        </label>
        <select
          id="categoryId"
          {...register('categoryId')}
          className="bg-surface-raised border border-border-default text-text-primary rounded-xl px-3 py-2.5 w-full focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-body-sm transition-colors cursor-pointer"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <span className="text-body-xs text-semantic_error-400 block mt-1">
            {errors.categoryId.message}
          </span>
        )}
      </div>

      {/* Item Name */}
      <Input
        label="Item Name"
        error={errors.name?.message}
        placeholder="e.g. Chicken Tikka"
        {...register('name')}
      />

      {/* Description */}
      <div className="block space-y-2 text-left">
        <label htmlFor="description" className="text-label-sm text-text-primary">
          Description <span className="text-text-tertiary font-normal">(Optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="e.g. Spicy grilled chicken pieces..."
          {...register('description')}
          className="bg-surface-raised border border-border-default text-text-primary rounded-xl px-3 py-2.5 w-full resize-none focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-body-sm transition-colors"
        />
        {errors.description && (
          <span className="text-body-xs text-semantic_error-400 block mt-1">
            {errors.description.message}
          </span>
        )}
      </div>

      {/* Price Input */}
      <div className="block space-y-2 text-left">
        <span className="text-label-sm text-text-primary">Price</span>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-text-tertiary text-body-sm font-medium select-none">₹</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            {...register('price', { valueAsNumber: true })}
            className={`pl-8 h-11 w-full rounded-lg border bg-surface-base px-3 text-body-sm text-text-primary outline-none transition-all duration-200 placeholder:text-text-tertiary focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 ${
              errors.price ? 'border-semantic_error-500 focus:border-semantic_error-400' : 'border-border-default'
            }`}
          />
        </div>
        {errors.price && (
          <span className="text-body-xs text-semantic_error-400 block mt-1">
            {errors.price.message}
          </span>
        )}
      </div>

      {/* Image Upload */}
      <ImageUpload
        currentImageUrl={currentImg}
        onImageSelect={(file) => {
          setImageFile(file)
          setCurrentImg(null)
        }}
        onImageClear={() => {
          setImageFile(null)
          setCurrentImg(null)
        }}
      />

      {/* Available Checkbox */}
      <div className="flex items-start gap-3 pt-2">
        <input
          type="checkbox"
          id="isAvailable"
          {...register('isAvailable')}
          className="mt-1 h-4 w-4 rounded border-border-default bg-surface-raised text-brand-500 focus:ring-brand-500/20 accent-brand-500"
        />
        <div className="flex flex-col">
          <label htmlFor="isAvailable" className="text-label-sm text-text-primary cursor-pointer">
            Item is available
          </label>
          <span className="text-body-xs text-text-tertiary mt-0.5">
            Unavailable items cannot be ordered by customers
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
          variant="brand"
          disabled={isSubmitting}
          className="w-full min-h-[44px]"
        >
          {isSubmitting ? (
            <Loader className="!flex-row !gap-1" />
          ) : item ? (
            'Save Changes'
          ) : (
            'Create Item'
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full min-h-[44px]"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
