'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import TurndownService from 'turndown'
import { updateBlogPostContent } from '@/app/actions/blogActions'
import AIWritingPanel from '@/components/AIWritingPanel'
import katex from 'katex'
import 'katex/dist/katex.css'

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

  // AI panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  // Text the user has selected inside the contentEditable — pushed to AI panel
  const [selectedEditorText, setSelectedEditorText] = useState('')
  // Saved selection range so that "replace selection" can restore it
  const savedRangeRef = useRef<Range | null>(null)

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
    return <>{children}</>
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

  // ── Open AI panel & optionally send selected text as context ─────────────
  const openAIPanel = () => {
    setAiPanelOpen(true)
    // selectedEditorText is already kept in sync via selectionchange
  }

  // ── Layout: when AI panel is open render a split view ────────────────────
  return (
    <div className="relative group">
      {/* Admin hint */}
      {!isEditing && (
        <div className="absolute -top-8 right-0 text-[10px] uppercase tracking-tighter text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Double-click to edit
        </div>
      )}

      {/* Split-panel wrapper */}
      <div className={`flex gap-0 transition-all duration-300 ${aiPanelOpen ? 'items-start' : ''}`}>

        {/* ── Left: Blog content ── */}
        <div className={`transition-all duration-300 min-w-0 ${aiPanelOpen ? 'flex-[3]' : 'flex-1'}`}>
          {/* Selection → AI badge (shown when text is selected while panel is open) */}
          {aiPanelOpen && selectedEditorText && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-3 py-2 text-xs text-violet-700 dark:text-violet-300">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="truncate flex-1">
                <strong>Selected:</strong> "{selectedEditorText.slice(0, 80)}{selectedEditorText.length > 80 ? '…' : ''}"
              </span>
              <span className="text-violet-500 shrink-0">→ sent to AI context</span>
            </div>
          )}

          <div
            ref={contentRef}
            onDoubleClick={handleDoubleClick}
            onInput={handleInput}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            className={`outline-none ${isEditing ? 'cursor-text' : ''}`}
          />
        </div>

        {/* ── Right: AI Panel (docked, no backdrop) ── */}
        {aiPanelOpen && (
          <div className="flex-[2] min-w-0 sticky top-4 self-start ml-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
          >
            <AIWritingPanel
              isOpen={aiPanelOpen}
              onClose={() => setAiPanelOpen(false)}
              currentContent={contentRef.current?.innerText || ''}
              selectedText={selectedEditorText}
              onInsert={handleAIInsert}
              onReplaceSelection={handleAIReplaceSelection}
              onSendToAI={() => {/* handled automatically via selectedEditorText */}}
            />
          </div>
        )}
      </div>

      {/* ── Floating Control Bar ── */}
      {isEditing && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 z-[100]">
          {/* Status dot */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              {hasChanges ? 'Unsaved Changes' : 'Draft Synced'}
            </span>
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-1.5">
            {/* AI toggle */}
            <button
              onClick={() => setAiPanelOpen((o) => !o)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                aiPanelOpen
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                  : 'text-purple-500 hover:bg-purple-500/10'
              }`}
              title={aiPanelOpen ? 'Close AI panel' : 'Open AI Writing Assistant'}
            >
              ⚡ AI
            </button>

            <button
              onClick={doSave}
              disabled={isSaving || !hasChanges}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                isSaving || !hasChanges
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-primary-500 hover:bg-primary-500/10'
              }`}
            >
              {isSaving ? 'Saving…' : 'Save (Ctrl+S)'}
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

      {/* Save success toast */}
      {saveStatus === 'success' && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-2xl z-[200] font-bold text-sm">
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
