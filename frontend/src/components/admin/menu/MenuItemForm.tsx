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
        <label htmlFor="categoryId" className="text-sm font-medium text-zinc-200">
          Category
        </label>
        <select
          id="categoryId"
          {...register('categoryId')}
          className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl px-3 py-2.5 w-full focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-sm transition-colors cursor-pointer"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <span className="text-xs text-red-400 block mt-1">
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
        <label htmlFor="description" className="text-sm font-medium text-zinc-200">
          Description <span className="text-zinc-500 font-normal">(Optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="e.g. Spicy grilled chicken pieces..."
          {...register('description')}
          className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl px-3 py-2.5 w-full resize-none focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 text-sm transition-colors"
        />
        {errors.description && (
          <span className="text-xs text-red-400 block mt-1">
            {errors.description.message}
          </span>
        )}
      </div>

      {/* Price Input */}
      <div className="block space-y-2 text-left">
        <span className="text-sm font-medium text-zinc-200">Price</span>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-zinc-500 text-sm font-medium select-none">₹</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            {...register('price', { valueAsNumber: true })}
            className={`pl-8 h-11 w-full rounded-lg border bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-all duration-200 placeholder:text-zinc-650 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 ${
              errors.price ? 'border-red-500 focus:border-red-400' : 'border-zinc-800'
            }`}
          />
        </div>
        {errors.price && (
          <span className="text-xs text-red-400 block mt-1">
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
          className="mt-1 h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-amber-500/20 accent-amber-500"
        />
        <div className="flex flex-col">
          <label htmlFor="isAvailable" className="text-sm font-semibold text-zinc-200 cursor-pointer">
            Item is available
          </label>
          <span className="text-xs text-zinc-500 mt-0.5">
            Unavailable items cannot be ordered by customers
          </span>
        </div>
      </div>

      {/* Server Error Message */}
      {serverError && (
        <p className="text-sm text-red-400 font-semibold pt-1">
          {serverError}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold min-h-11 border-0"
        >
          {isSubmitting ? (
            <Loader className="!flex-row !gap-1" />
          ) : item ? (
            'Save Changes'
          ) : (
            'Create Item'
          )}
        </Button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full py-2.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 rounded-xl text-sm font-semibold transition-colors bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
