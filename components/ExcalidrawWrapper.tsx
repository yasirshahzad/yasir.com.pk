'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTheme } from 'next-themes'

interface ExcalidrawWrapperProps {
  initialData: any
  readOnly?: boolean
  canEdit?: boolean
  onSave?: (data: any) => void
}

/**
 * Enhanced ExcalidrawWrapper with Direct Editing support.
 */
const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({ 
  initialData, 
  readOnly = true, 
  canEdit = false,
  onSave 
}) => {
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { resolvedTheme } = useTheme()
  const excalidrawAPI = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const saveTimerRef = useRef<NodeJS.Timeout|null>(null)

  // 1. Dynamic import of Excalidraw (browser only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@excalidraw/excalidraw').then((res) => {
        setExcalidrawComponent(res.Excalidraw)
      })
    }
  }, [])

  // 2. Process and sanitize data (Avoid spreading unknown appState which can cause runtime errors)
  const sceneData = useMemo(() => {
    if (!initialData) return null
    return {
      elements: Array.isArray(initialData.elements) ? initialData.elements : [],
      appState: {
        viewBackgroundColor: resolvedTheme === 'dark' ? '#313131' : '#ffffff',
        currentItemStrokeColor: resolvedTheme === 'dark' ? '#ffffff' : '#000000',
        gridSize: initialData.appState?.gridSize || 20,
      },
      files: typeof initialData.files === 'object' ? initialData.files : {},
    }
  }, [initialData, resolvedTheme])

  // 3. Center content
  useEffect(() => {
    if (ExcalidrawComponent && excalidrawAPI.current && sceneData && sceneData.elements.length > 0 && !isEditing) {
      const timer = setTimeout(() => {
        try {
          if (excalidrawAPI.current) {
            excalidrawAPI.current.scrollToContent(sceneData.elements, {
              fitToViewport: true,
              padding: 40,
            })
          }
        } catch (e) {
          console.error('Excalidraw focus error:', e)
        } finally {
          setIsReady(true)
        }
      }, 500)
      return () => clearTimeout(timer)
    } else if (ExcalidrawComponent && isEditing) {
       setIsReady(true)
    }
  }, [ExcalidrawComponent, sceneData, isEditing])

  // 4. Handle changes (Debounced)
  const handleChange = (elements: any[], appState: any, files: any) => {
    if (!isEditing || !onSave) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      onSave({
        type: 'excalidraw',
        version: 2,
        elements,
        appState: {
           viewBackgroundColor: appState.viewBackgroundColor,
           gridSize: appState.gridSize,
        },
        files
      })
    }, 1000)
  }

  // 5. Cleanup on unmount
  useEffect(() => {
    return () => {
      // If there's a pending save, trigger it immediately
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        if (excalidrawAPI.current && onSave) {
          const elements = excalidrawAPI.current.getSceneElements()
          const appState = excalidrawAPI.current.getAppState()
          const files = excalidrawAPI.current.getFiles()
          onSave({ elements, appState, files })
        }
      }
    }
  }, [onSave])

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
  const effectiveReadOnly = readOnly && !isEditing

  return (
    <div 
      className={`relative h-[500px] w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: currentTheme === 'dark' ? '#121212' : '#ffffff' }}
    >
      <ExcalidrawComponent
        excalidrawRef={(api: any) => (excalidrawAPI.current = api)}
        initialData={sceneData}
        onChange={handleChange}
        viewModeEnabled={!!effectiveReadOnly}
        zenModeEnabled={!!effectiveReadOnly}
        gridModeEnabled={!!isEditing}
        theme={currentTheme}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: !!isEditing,
            loadScene: !!isEditing,
            export: {
              saveFileToDisk: true,
            },
            themeSelection: false,
          },
        }}
      />
      
      {/* Edit Trigger */}
      {canEdit && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
            >
              <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Diagram
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-xl hover:bg-primary-600 transition-all animate-pulse"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Done Editing
            </button>
          )}
        </div>
      )}

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#121212] z-10">
           <div className="flex flex-col items-center gap-3">
             <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Initialising Editor...</span>
           </div>
        </div>
      )}
    </div>
  )
}

export default ExcalidrawWrapper
