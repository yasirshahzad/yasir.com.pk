'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import TurndownService from 'turndown'
import { updateBlogPostContent } from '@/app/actions/blogActions'

interface InlinePostEditorProps {
  slug: string
  initialHtml: string
  isAdmin: boolean
  children: React.ReactNode
}

export default function InlinePostEditor({
  slug,
  initialHtml,
  isAdmin,
  children,
}: InlinePostEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const contentRef = useRef<HTMLDivElement>(null)
  const snapshotRef = useRef<string>(initialHtml)

  // Set initial HTML via ref on mount (React never controls this div's innerHTML)
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = initialHtml
    }
  }, [initialHtml])

  const doSave = useCallback(async () => {
    if (!contentRef.current || !hasChanges) {
      if (!hasChanges) setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
      })

      turndownService.addRule('code', {
        filter: ['pre'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        replacement: function (content, node: any) {
          const code = node.querySelector('code')
          const className = code ? code.className : ''
          const language = className.replace('language-', '') || ''
          return '\n\n```' + language + '\n' + (code ? code.innerText : node.innerText) + '\n```\n\n'
        },
      })

      turndownService.addRule('math', {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filter: (node: any) => node.classList.contains('katex'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        replacement: function (content, node: any) {
          const annotation = node.querySelector('annotation')
          if (annotation) return '$' + annotation.textContent + '$'
          const ariaLabel = node.getAttribute('aria-label')
          if (ariaLabel) return '$' + ariaLabel + '$'
          return content
        },
      })

      const editedHtml = contentRef.current.innerHTML
      const markdown = turndownService.turndown(editedHtml)

      const result = await updateBlogPostContent(slug, markdown)

      if (result.success) {
        snapshotRef.current = editedHtml
        setSaveStatus('success')
        setHasChanges(false)
        setIsEditing(false)
      } else {
        setSaveStatus('error')
        alert(result.error || 'Failed to save changes')
      }
    } catch (error) {
      console.error('Error saving post:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }, [hasChanges, slug])

  const doCancel = useCallback(() => {
    // Restore to last saved snapshot
    if (contentRef.current) {
      contentRef.current.innerHTML = snapshotRef.current
    }
    setIsEditing(false)
    setHasChanges(false)
  }, [])

  // Keyboard Shortcuts (Ctrl+S / Cmd+S / Esc)
  useEffect(() => {
    if (!isEditing || !isAdmin) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        doSave()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        doCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, isAdmin, doSave, doCancel])

  // Reset status after a delay
  useEffect(() => {
    if (saveStatus !== 'idle') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  if (!isAdmin) {
    return <>{children}</>
  }

  const handleDoubleClick = () => {
    if (isEditing) return
    setIsEditing(true)
    setHasChanges(false)

    // Focus the content area
    setTimeout(() => {
      contentRef.current?.focus()
    }, 0)
  }

  const handleInput = () => {
    if (!hasChanges) setHasChanges(true)
  }

  return (
    <div className="relative group">
      {/* Subtle Admin Hint (only visible on hover) */}
      {!isEditing && (
        <div className="absolute -top-8 right-0 text-[10px] uppercase tracking-tighter text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Double-click to edit
        </div>
      )}

      {/* Modern Floating Minimal Control Bar */}
      {isEditing && (
        <div className="fixed bottom-8 right-8 flex items-center gap-3 px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 z-[100]">
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
             <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
               {hasChanges ? 'Unsaved Changes' : 'Draft Synced'}
             </span>
          </div>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={doSave}
              disabled={isSaving || !hasChanges}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                isSaving || !hasChanges
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-primary-500 hover:bg-primary-500/10'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save (Ctrl+S)'}
            </button>
            <button
              onClick={doCancel}
              className="text-xs font-bold px-3 py-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-500/10 rounded-lg transition-all"
            >
              Discard (Esc)
            </button>
          </div>
        </div>
      )}

      {/* Global Success Notification */}
      {saveStatus === 'success' && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-2xl z-[200] font-bold text-sm">
          ✓ Post Synchronized
        </div>
      )}

      {/* Content div — React does NOT control innerHTML, only the ref does */}
      <div
        ref={contentRef}
        onDoubleClick={handleDoubleClick}
        onInput={handleInput}
        contentEditable={isEditing}
        suppressContentEditableWarning={true}
        className={`outline-none ${isEditing ? 'cursor-text' : ''}`}
      />
    </div>
  )
}
