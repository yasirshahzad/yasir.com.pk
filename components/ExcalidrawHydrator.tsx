'use client'

import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import ExcalidrawWrapper from './ExcalidrawWrapper'

interface ExcalidrawHydratorProps {
  html: string
  canEdit?: boolean
  onChange?: () => void
}

/**
 * ExcalidrawHydrator scanning logic with Direct Editing support.
 * Optimized for stability using MutationObservers instead of polling.
 */
export default function ExcalidrawHydrator({ html, canEdit = false, onChange }: ExcalidrawHydratorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [processedHtml, setProcessedHtml] = useState('')
  const [diagrams, setDiagrams] = useState<{ id: string; data: any }[]>([])

  const getContentHash = (text: string) => {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i)
        hash |= 0
    }
    return Math.abs(hash).toString(36)
  }

  useEffect(() => {
    if (!html) return

    const doc = new DOMParser().parseFromString(html, 'text/html')
    const codeBlocks = doc.querySelectorAll('pre code.language-excalidraw')
    
    const newDiagrams: { id: string; data: any }[] = []
    
    codeBlocks.forEach((block, index) => {
      try {
        const rawContent = block.textContent || ''
        const jsonText = rawContent.replace(/```json|```excalidraw|```/g, '').trim()
        if (!jsonText) return

        const json = JSON.parse(jsonText)
        const hash = getContentHash(jsonText)
        const id = `excalidraw-${index}-${hash}`
        
        const placeholder = doc.createElement('div')
        placeholder.id = id
        placeholder.setAttribute('data-excalidraw', JSON.stringify(json))
        placeholder.className = 'excalidraw-container my-8 w-full h-[500px] bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden'
        
        const pre = block.parentElement
        if (pre && pre.parentElement) {
          pre.parentElement.replaceChild(placeholder, pre)
        }
        
        newDiagrams.push({ id, data: json })
      } catch (e) {
        if (block.textContent && block.textContent.length > 10) {
           console.error('Excalidraw parse error:', e)
        }
      }
    })

    setProcessedHtml(doc.body.innerHTML)
    setDiagrams(newDiagrams)
  }, [html])

  const handleDiagramChange = (id: string, newData: any) => {
    if (!containerRef.current) return
    const el = containerRef.current.querySelector(`#${id}`)
    if (el) {
      el.setAttribute('data-excalidraw', JSON.stringify(newData))
      if (onChange) onChange()
    }
  }

  return (
    <div ref={containerRef} className="relative excalidraw-hydrator-root">
      <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
      {diagrams.map((diagram) => (
        <ExcalidrawPortal key={diagram.id} targetId={diagram.id} container={containerRef.current}>
          <ExcalidrawWrapper 
            initialData={diagram.data} 
            readOnly={!canEdit} 
            canEdit={canEdit}
            onSave={(newData) => handleDiagramChange(diagram.id, newData)}
          />
        </ExcalidrawPortal>
      ))}
    </div>
  )
}

/**
 * ExcalidrawPortal uses MutationObserver for high-stability DOM targeting.
 */
function ExcalidrawPortal({ targetId, container, children }: { targetId: string; container: HTMLElement | null; children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    if (!container) return

    // 1. Initial check
    const existing = container.querySelector(`#${targetId}`)
    if (existing) {
      setTarget(existing as HTMLElement)
      return
    }

    // 2. Observe for the element if it's not there yet
    const observer = new MutationObserver(() => {
      const el = container.querySelector(`#${targetId}`)
      if (el) {
        setTarget(el as HTMLElement)
        observer.disconnect()
      }
    })

    observer.observe(container, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [container, targetId])

  if (!target) return null
  return createPortal(children, target)
}
