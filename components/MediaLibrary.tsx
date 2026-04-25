/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { listImages, deleteImage } from '@/lib/supabase-storage'
import Image from 'next/image'

interface MediaLibraryProps {
  onSelect: (url: string) => void
}

export default function MediaLibrary({ onSelect }: MediaLibraryProps) {
  const [images, setImages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchImages = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await listImages()
      setImages(data || [])
    } catch (err: any) {
      console.error('Failed to fetch media:', err)
      setError('Could not load media library')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleDelete = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      await deleteImage(name)
      setImages((prev) => prev.filter((img) => img.name !== name))
    } catch (err) {
      alert('Failed to delete image')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <div className="border-primary-500 mb-4 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-[10px] font-bold tracking-widest uppercase">Scanning Storage...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-xs text-red-500">
        {error}
        <button onClick={fetchImages} className="text-primary-500 mx-auto mt-2 block underline">
          Retry
        </button>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-100 p-12 text-gray-400 dark:border-gray-800">
        <svg
          className="mb-3 h-8 w-8 opacity-20"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-center text-[10px] font-bold tracking-widest uppercase">
          Your Library is Empty
        </p>
        <p className="mt-1 text-center text-[9px]">Upload images to see them here.</p>
      </div>
    )
  }

  return (
    <div className="custom-scrollbar grid max-h-[300px] grid-cols-2 gap-3 overflow-y-auto pr-1">
      {images.map((img) => (
        <button
          key={img.name}
          type="button"
          onClick={() => onSelect(img.url)}
          className="group hover:border-primary-500/50 relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-gray-100 bg-gray-50 text-left transition-all hover:scale-[1.02] hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <img src={img.url} alt={img.name} loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <p className="truncate font-mono text-[8px] text-white">{img.name}</p>
          </div>

          <div
            onClick={(e) => handleDelete(e, img.name)}
            onKeyDown={(e) => e.key === 'Enter' && handleDelete(e as any, img.name)}
            role="button"
            tabIndex={0}
            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-md bg-red-500 text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 hover:bg-red-600"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </button>
      ))}
    </div>
  )
}
