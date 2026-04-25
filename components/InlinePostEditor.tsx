/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import TurndownService from 'turndown'
import { updateBlogPostContent } from '@/app/actions/blogActions'
import AIWritingPanel from '@/components/AIWritingPanel'
import FloatingToolbar from '@/components/FloatingToolbar'
import ExcalidrawHydrator from '@/components/ExcalidrawHydrator'
import katex from 'katex'
import 'katex/dist/katex.css'
interface InlinePostEditorProps {
  slug: string
  initialHtml: string
  isAdmin: boolean
  metadata?: {
    title: string
    summary: string
    images?: string[]
  }
}

export default function InlinePostEditor({
  slug,
  initialHtml,
  isAdmin,
  metadata,
}: InlinePostEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const contentRef = useRef<HTMLDivElement>(null)
  const snapshotRef = useRef<string>(initialHtml)

  // AI panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  // Text the user has selected inside the contentEditable — pushed to AI panel
  const [selectedEditorText, setSelectedEditorText] = useState('')
  // Saved selection range so that "replace selection" can restore it
  const savedRangeRef = useRef<Range | null>(null)

  // ── AI: Append at end ────────────────────────────────────────────────────
  const handleAIInsert = useCallback((text: string) => {
    if (!contentRef.current) return
    const html = markdownToHtml(text)
    contentRef.current.innerHTML += '<br><br>' + html
    setHasChanges(true)
    // Keep AI panel open — user may want to generate more
  }, [])

  // ── AI: Replace the saved selection ──────────────────────────────────────
  const handleAIReplaceSelection = useCallback((text: string) => {
    if (!contentRef.current) return

    const html = markdownToHtml(text)

    if (savedRangeRef.current) {
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedRangeRef.current)
        // Delete selection and insert new HTML
        const range = savedRangeRef.current
        range.deleteContents()
        const fragment = range.createContextualFragment(html)
        range.insertNode(fragment)
        selection.collapseToEnd()
        savedRangeRef.current = null
        setSelectedEditorText('')
      }
    } else {
      // Fallback: append at end if no saved selection
      contentRef.current.innerHTML += '<br><br>' + html
    }

    setHasChanges(true)
  }, [])

  // ── Bootstrap the editor content ──────────────────────────────────────────
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = initialHtml
    }
  }, [initialHtml])

  // ── Capture selection inside the editor so we can send it to the AI panel ─
  const captureSelection = useCallback(() => {
    const selection = window.getSelection()
    if (
      !selection ||
      selection.isCollapsed ||
      !contentRef.current ||
      !contentRef.current.contains(selection.anchorNode)
    ) {
      return
    }
    const text = selection.toString().trim()
    if (text.length > 3) {
      setSelectedEditorText(text)
      // Clone and save the range so we can replace it later
      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', captureSelection)
    return () => document.removeEventListener('selectionchange', captureSelection)
  }, [captureSelection])

  // ── Save ──────────────────────────────────────────────────────────────────
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

        replacement: function (content, node: any) {
          const code = node.querySelector('code')
          const className = code ? code.className : ''
          const language = className.replace('language-', '') || ''
          return (
            '\n\n```' + language + '\n' + (code ? code.innerText : node.innerText) + '\n```\n\n'
          )
        },
      })

      turndownService.addRule('math', {
        filter: (node: any) => node.classList.contains('katex'),

        replacement: function (content, node: any) {
          const annotation = node.querySelector('annotation')
          if (annotation) return '$' + annotation.textContent + '$'
          const ariaLabel = node.getAttribute('aria-label')
          if (ariaLabel) return '$' + ariaLabel + '$'
          return content
        },
      })

      turndownService.addRule('excalidraw', {
        filter: (node: any) => node.hasAttribute('data-excalidraw'),
        replacement: function (content, node: any) {
          const json = node.getAttribute('data-excalidraw')
          return '\n\n```excalidraw\n' + json + '\n```\n\n'
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

  // ── Cancel ────────────────────────────────────────────────────────────────
  const doCancel = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = snapshotRef.current
    }
    setIsEditing(false)
    setHasChanges(false)
    setAiPanelOpen(false)
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
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

  // ── Reset status after delay ───────────────────────────────────────────────
  useEffect(() => {
    if (saveStatus !== 'idle') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  if (!isAdmin) {
    return <ExcalidrawHydrator html={initialHtml} />
  }

  const handleDoubleClick = () => {
    if (isEditing) return
    setIsEditing(true)
    setHasChanges(false)
    setTimeout(() => contentRef.current?.focus(), 0)
  }

  const handleInput = () => {
    if (!hasChanges) setHasChanges(true)
  }

  // ── Toolbar Handlers ─────────────────────────────────────────────────────

  const onBold = () => {
    document.execCommand('bold', false)
    setHasChanges(true)
  }
  const onItalic = () => {
    document.execCommand('italic', false)
    setHasChanges(true)
  }
  const onHeading = (level: number) => {
    document.execCommand('formatBlock', false, `h${level}`)
    setHasChanges(true)
  }
  const onLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      document.execCommand('createLink', false, url)
      setHasChanges(true)
    }
  }
  const onImage = (url: string) => {
    const imgHtml = `<br><img src="${url}" alt="Uploaded Image" class="rounded-xl shadow-lg my-6" /><br>`
    document.execCommand('insertHTML', false, imgHtml)
    setHasChanges(true)
  }
  const onDiagram = () => {
    setAiPanelOpen(true)
    // Small tip: switch to diagram mode in the AI panel
  }
  const onCallout = (type: string) => {
    const html = `<br><blockquote class="admonition admonition-${type.toLowerCase()}"><strong>${type}</strong><br>New ${type.toLowerCase()} content...</blockquote><br>`
    document.execCommand('insertHTML', false, html)
    setHasChanges(true)
  }

  // ── Open AI panel & optionally send selected text as context ─────────────
  const openAIPanel = () => {
    setAiPanelOpen(true)
    // selectedEditorText is already kept in sync via selectionchange
  }

  // ── Layout: when AI panel is open render a split view ────────────────────
  return (
    <div className="group relative">
      {/* Admin hint */}
      {!isEditing && (
        <div className="pointer-events-none absolute -top-8 right-0 text-[10px] tracking-tighter text-gray-400 uppercase opacity-0 transition-opacity group-hover:opacity-100">
          Double-click to edit
        </div>
      )}

      {/* Split-panel wrapper */}
      <div className={`flex gap-0 transition-all duration-300 ${aiPanelOpen ? 'items-start' : ''}`}>
        {/* ── Left: Blog content ── */}
        <div
          className={`min-w-0 transition-all duration-300 ${aiPanelOpen ? 'flex-[3]' : 'flex-1'}`}
        >
          {/* Selection → AI badge (shown when text is selected while panel is open) */}
          {aiPanelOpen && selectedEditorText && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="flex-1 truncate">
                <strong>Selected:</strong> "{selectedEditorText.slice(0, 80)}
                {selectedEditorText.length > 80 ? '…' : ''}"
              </span>
              <span className="shrink-0 text-violet-500">→ sent to AI context</span>
            </div>
          )}

          <div
            ref={contentRef}
            onDoubleClick={handleDoubleClick}
            onInput={handleInput}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            className={`min-h-[100px] outline-none ${isEditing ? 'cursor-text rounded-xl p-4 ring-1 ring-violet-200 dark:ring-violet-800' : ''}`}
          />
          {/* External Hydrator: Points to the editable div and manages diagrams from the outside */}
          <ExcalidrawHydrator
            externalContainer={contentRef.current}
            canEdit={isEditing}
            onChange={() => setHasChanges(true)}
          />
        </div>

        {/* ── Right: AI Panel (docked, no backdrop) ── */}
        {aiPanelOpen && (
          <div
            className="sticky top-4 ml-6 min-w-0 flex-[2] self-start overflow-hidden rounded-2xl border border-gray-200 shadow-xl dark:border-gray-800"
            style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
          >
            <AIWritingPanel
              isOpen={aiPanelOpen}
              onClose={() => setAiPanelOpen(false)}
              currentContent={contentRef.current?.innerText || ''}
              selectedText={selectedEditorText}
              onInsert={handleAIInsert}
              onReplaceSelection={handleAIReplaceSelection}
              onSendToAI={() => {
                /* handled automatically via selectedEditorText */
              }}
              title={metadata?.title}
              summary={metadata?.summary}
              slug={slug}
              images={metadata?.images}
            />
          </div>
        )}
      </div>

      {/* ── Floating Toolbar ── */}
      {isEditing && (
        <div className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2">
          <FloatingToolbar
            onBold={onBold}
            onItalic={onItalic}
            onHeading={onHeading}
            onLink={onLink}
            onImage={onImage}
            onDiagram={onDiagram}
            onCallout={onCallout}
            onAI={() => setAiPanelOpen((o) => !o)}
            onSave={doSave}
            onCancel={doCancel}
            isSaving={isSaving}
            hasChanges={hasChanges}
            aiActive={aiPanelOpen}
          />
        </div>
      )}

      {/* Save success toast */}
      {saveStatus === 'success' && (
        <div className="fixed top-12 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow-2xl dark:bg-white dark:text-gray-900">
          ✓ Post Synchronized
        </div>
      )}
    </div>
  )
}

// ── Minimal markdown → HTML helper ───────────────────────────────────────────
function markdownToHtml(text: string): string {
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, content) => {
      const className = lang ? ` class="language-${lang}"` : ''
      return `<pre><code${className}>${content}</code></pre>`
    })
    .replace(/`(.*?)`/g, '<code>$1</code>')

  // Handle KaTeX math: $...$
  html = html.replace(/\$(.*?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false })
    } catch (e) {
      return `<span class="text-red-500">$${math}$</span>`
    }
  })

  return html.replace(/\n/g, '<br>')
}
