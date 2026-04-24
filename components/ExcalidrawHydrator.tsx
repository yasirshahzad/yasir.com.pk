'use client'

import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import ExcalidrawWrapper from './ExcalidrawWrapper'

interface ExcalidrawHydratorProps {
  html?: string
  externalContainer?: HTMLElement | null
  canEdit?: boolean
  onChange?: () => void
}

/**
 * ExcalidrawHydrator: Now supports both self-rendering and external container hydration.
 * If externalContainer is provided, it scans that DOM element directly.
 */
export default function ExcalidrawHydrator({ html, externalContainer, canEdit = false, onChange }: ExcalidrawHydratorProps) {
  const internalRef = useRef<HTMLDivElement>(null)
  const container = externalContainer || internalRef.current
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

  // ── Mode A: Self-rendering from html prop ─────────────────────────────────
  useEffect(() => {
    if (!html || externalContainer) return

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
        placeholder.contentEditable = 'false' // CRITICAL for stability
        
        const pre = block.parentElement
        if (pre && pre.parentElement) {
          pre.parentElement.replaceChild(placeholder, pre)
        }
        newDiagrams.push({ id, data: json })
      } catch (e) {
        console.error('Excalidraw parse error:', e)
      }
    })

    setProcessedHtml(doc.body.innerHTML)
    setDiagrams(newDiagrams)
  }, [html, externalContainer])

  // ── Mode B: Hydrating external container (e.g. contentEditable) ───────────
  const scanExternal = useCallback(() => {
    if (!externalContainer) return
    const codeBlocks = externalContainer.querySelectorAll('pre code.language-excalidraw')
    const newDiagrams: { id: string; data: any }[] = []
    
    codeBlocks.forEach((block, index) => {
      try {
        const rawContent = block.textContent || ''
        const jsonText = rawContent.replace(/```json|```excalidraw|```/g, '').trim()
        if (!jsonText) return
        const json = JSON.parse(jsonText)
        const hash = getContentHash(jsonText)
        const id = `excalidraw-${index}-${hash}`
        
        const placeholder = document.createElement('div')
        placeholder.id = id
        placeholder.setAttribute('data-excalidraw', JSON.stringify(json))
        placeholder.className = 'excalidraw-container my-8 w-full h-[500px] bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden'
        placeholder.contentEditable = 'false'
        
        const pre = block.parentElement
        if (pre && pre.parentElement) {
          pre.parentElement.replaceChild(placeholder, pre)
        }
        newDiagrams.push({ id, data: json })
      } catch (e) {
        console.error('External scan error:', e)
      }
    })
    
    if (newDiagrams.length > 0) {
      setDiagrams(prev => {
        // Simple merge to avoid unmounting existing ones with same ID
        const existingIds = prev.map(d => d.id)
        const filtered = newDiagrams.filter(d => !existingIds.includes(d.id))
        return [...prev, ...filtered]
      })
    }
  }, [externalContainer])

  useEffect(() => {
    if (externalContainer) {
      scanExternal()
      // Also observe for new code blocks being pasted
      const observer = new MutationObserver(() => scanExternal())
      observer.observe(externalContainer, { childList: true, subtree: true })
      return () => observer.disconnect()
    }
  }, [externalContainer, scanExternal])

  const handleDiagramChange = (id: string, newData: any) => {
    const el = container?.querySelector(`#${id}`)
    if (el) {
      el.setAttribute('data-excalidraw', JSON.stringify(newData))
      if (onChange) onChange()
    }
  }

  return (
    <div ref={internalRef} className="relative excalidraw-hydrator-root">
      {/* Only render processedHtml if we aren't using an external container */}
      {!externalContainer && <div dangerouslySetInnerHTML={{ __html: processedHtml }} />}
      
      {diagrams.map((diagram) => (
        <ExcalidrawPortal key={diagram.id} targetId={diagram.id} container={container}>
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

function ExcalidrawPortal({ targetId, container, children }: { targetId: string; container: HTMLElement | null; children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => {
    if (!container) return
    const find = () => {
      const el = container.querySelector(`#${targetId}`)
      if (el) {
        setTarget(el as HTMLElement)
        return true
      }
      return false
    }
    if (find()) return
    const observer = new MutationObserver(() => { if (find()) observer.disconnect() })
    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [container, targetId])
  if (!target) return null
  return createPortal(children, target)
}
