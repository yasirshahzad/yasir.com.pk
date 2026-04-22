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
      setImages(prev => prev.filter(img => img.name !== name))
    } catch (err) {
      alert('Failed to delete image')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Scanning Storage...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 text-xs">
        {error}
        <button onClick={fetchImages} className="block mx-auto mt-2 text-primary-500 underline">Retry</button>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl text-gray-400">
        <svg className="w-8 h-8 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-[10px] font-bold uppercase tracking-widest text-center">Your Library is Empty</p>
        <p className="text-[9px] mt-1 text-center">Upload images to see them here.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
      {images.map((img) => (
        <div 
          key={img.name}
          onClick={() => onSelect(img.url)}
          className="group relative aspect-square rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg hover:border-primary-500/50"
        >
          <img 
            src={img.url} 
            alt={img.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[8px] text-white truncate font-mono">{img.name}</p>
          </div>
          
          <button
            onClick={(e) => handleDelete(e, img.name)}
            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-xl"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
