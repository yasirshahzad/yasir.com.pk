/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useRef } from 'react'
import { uploadImage } from '@/lib/supabase-storage'

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void
  label?: string
}

export default function ImageUploader({
  onUploadSuccess,
  label = 'Add Image',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await processUpload(file)
  }

  const processUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (jpg, png, etc.)')
      }

      // Max size 5MB
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB')
      }

      const url = await uploadImage(file)
      onUploadSuccess(url)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
          isUploading
            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800'
            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
      >
        {isUploading ? (
          <>
            <div className="border-primary-500 h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
            Uploading...
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {label}
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 z-50 mt-2 rounded-md border border-red-100 bg-red-50 p-2 text-[10px] whitespace-nowrap text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
