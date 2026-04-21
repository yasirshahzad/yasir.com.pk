'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import ExcalidrawWrapper from './ExcalidrawWrapper'

interface ExcalidrawHydratorProps {
  html: string
}

/**
 * ExcalidrawHydrator scans HTML for code blocks marked as 'excalidraw'
 * and replaces them with live interactive diagrams.
 * Uses hash-based IDs to prevent unnecessary re-mounts during live editing.
 */
export default function ExcalidrawHydrator({ html }: ExcalidrawHydratorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [processedHtml, setProcessedHtml] = useState('')
  const [diagrams, setDiagrams] = useState<{ id: string; data: any }[]>([])

  // Simple hash function to generate stable IDs from content
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
        // Clean up: remove markdown fences and language tags if they leaked in
        const jsonText = rawContent.replace(/```json|```excalidraw|```/g, '').trim()
        if (!jsonText) return

        const json = JSON.parse(jsonText)
        
        // Stable ID based on the JSON content hash + position
        // This prevents the diagram from re-mounting every keystroke if its content hasn't changed
        const hash = getContentHash(jsonText)
        const id = `excalidraw-${index}-${hash}`
        
        const placeholder = doc.createElement('div')
        placeholder.id = id
        placeholder.className = 'excalidraw-container my-8 w-full h-[500px] bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden'
        
        const pre = block.parentElement
        if (pre && pre.parentElement) {
          pre.parentElement.replaceChild(placeholder, pre)
        }
        
        newDiagrams.push({ id, data: json })
      } catch (e) {
        // Only log parse errors if the content is long enough to be an actual attempt at JSON
        if (block.textContent && block.textContent.length > 10) {
           console.error('Excalidraw parse error:', e)
        }
      }
    })

    setProcessedHtml(doc.body.innerHTML)
    setDiagrams(newDiagrams)
  }, [html])

  return (
    <div ref={containerRef} className="relative">
      <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
      {diagrams.map((diagram) => (
        <ExcalidrawPortal key={diagram.id} targetId={diagram.id} container={containerRef.current}>
          <ExcalidrawWrapper initialData={diagram.data} readOnly={true} />
        </ExcalidrawPortal>
      ))}
    </div>
  )
}

function ExcalidrawPortal({ targetId, container, children }: { targetId: string; container: HTMLElement | null; children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)

  // Use MutationObserver or Interval to find the target reliably since the HTML is rendered via dangerouslySetInnerHTML
  useEffect(() => {
    const findTarget = () => {
        if (!container) return
        const el = container.querySelector(`#${targetId}`)
        if (el) {
          setTarget(el as HTMLElement)
          return true
        }
        return false
    }

    if (findTarget()) return

    const interval = setInterval(() => {
        if (findTarget()) clearInterval(interval)
    }, 100)

    return () => clearInterval(interval)
  }, [container, targetId])

  if (!target) return null
  return createPortal(children, target)
}
