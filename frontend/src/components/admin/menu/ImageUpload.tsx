'use client'

import { useRef, useState, useEffect } from 'react'

interface ImageUploadProps {
  currentImageUrl: string | null
  onImageSelect: (file: File) => void
  onImageClear: () => void
}

export default function ImageUpload({
  currentImageUrl,
  onImageSelect,
  onImageClear
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset local preview if parent clears/changes current image externally
  useEffect(() => {
    if (!currentImageUrl) {
      setPreviewUrl(null)
    }
  }, [currentImageUrl])

  const validateAndSelectFile = (file: File) => {
    setError(null)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are accepted.')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File size too large. Max size is 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
    onImageSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndSelectFile(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSelectFile(file)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageClear()
  }

  const displayImage = previewUrl || currentImageUrl

  return (
    <div className="space-y-2 text-left">
      <span className="text-sm font-medium text-zinc-200 block">
        Item Image (Optional)
      </span>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {displayImage ? (
        <div className="relative rounded-xl overflow-hidden h-48 border border-zinc-800 bg-zinc-950 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage}
            alt="Upload preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white font-bold text-base flex items-center justify-center border-0 cursor-pointer shadow transition-colors"
            title="Remove image"
          >
            &times;
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[12rem] ${
            isDragging
              ? 'border-amber-500 bg-amber-500/5'
              : 'border-zinc-700 hover:border-amber-500/50 bg-zinc-950/20'
          }`}
        >
          <span className="text-3xl mb-3 block" role="img" aria-label="camera">
            📸
          </span>
          <span className="text-sm text-zinc-300 font-semibold">
            Click or drag to upload
          </span>
          <span className="text-xs text-zinc-500 mt-1.5 font-medium">
            JPEG, PNG, WebP — max 5MB
          </span>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs font-semibold ml-0.5 mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
