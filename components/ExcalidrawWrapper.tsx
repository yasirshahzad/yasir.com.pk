'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTheme } from 'next-themes'

interface ExcalidrawWrapperProps {
  initialData: any
  readOnly?: boolean
}

/**
 * A robust wrapper for Excalidraw that handles:
 * 1. Client-side only loading (Dynamic Import)
 * 2. Theme synchronization (Light/Dark)
 * 3. Auto-centering content
 * 4. Handling of structural data fixes
 */
const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({ initialData, readOnly = true }) => {
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<any>(null)
  const { resolvedTheme } = useTheme()
  const excalidrawAPI = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)

  // 1. Dynamic import of Excalidraw (browser only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@excalidraw/excalidraw').then((res) => {
        setExcalidrawComponent(res.Excalidraw)
      })
    }
  }, [])

  // 2. Process and sanitize data
  const sceneData = useMemo(() => {
    if (!initialData) return null
    return {
      elements: Array.isArray(initialData.elements) ? initialData.elements : [],
      appState: {
        viewBackgroundColor: resolvedTheme === 'dark' ? '#121212' : '#ffffff',
        currentItemStrokeColor: resolvedTheme === 'dark' ? '#ffffff' : '#000000',
        ...initialData.appState,
      },
      files: initialData.files || {},
    }
  }, [initialData, resolvedTheme])

  // 3. Center content when everything is ready
  useEffect(() => {
    if (ExcalidrawComponent && excalidrawAPI.current && sceneData && sceneData.elements.length > 0) {
      const timer = setTimeout(() => {
        try {
          excalidrawAPI.current.scrollToContent(sceneData.elements, {
            fitToViewport: true,
            padding: 40,
          })
          setIsReady(true)
        } catch (e) {
          console.error('Excalidraw scroll error:', e)
        }
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [ExcalidrawComponent, sceneData])

  if (!ExcalidrawComponent) {
    return (
      <div className="flex h-[450px] w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Loading Canvas Engine...
        </p>
      </div>
    )
  }

  const currentTheme = (resolvedTheme === 'dark' ? 'dark' : 'light')

  return (
    <div 
      className={`relative h-[500px] w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: currentTheme === 'dark' ? '#121212' : '#ffffff' }}
    >
      <ExcalidrawComponent
        excalidrawRef={(api: any) => (excalidrawAPI.current = api)}
        initialData={sceneData}
        viewModeEnabled={readOnly}
        zenModeEnabled={readOnly}
        gridModeEnabled={false}
        theme={currentTheme}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: !readOnly,
            loadScene: !readOnly,
            export: !readOnly,
          },
        }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#121212] z-10">
           <div className="flex flex-col items-center gap-3">
             <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Rendering Design...</span>
           </div>
        </div>
      )}
    </div>
  )
}

export default ExcalidrawWrapper
