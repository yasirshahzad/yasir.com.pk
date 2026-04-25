'use client'

import { useEffect, useRef, useState } from 'react'
import { saveNote } from 'app/actions/noteActions'

export default function HighlightToShare() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // Keep a ref so the mousedown handler can always read the latest position
  const positionRef = useRef(position)
  positionRef.current = position

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setPosition(null)
        setSelectedText('')
        return
      }

      // Ensure the selection is actually inside our article prose.
      let node: Node | null = selection.anchorNode
      let inProse = false
      while (node) {
        if (node.nodeType === 1 && (node as Element).classList.contains('prose')) {
          inProse = true
          break
        }
        node = node.parentNode
      }

      if (!inProse) {
        setPosition(null)
        return
      }

      const text = selection.toString().trim()
      if (text.length > 5) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        // Use viewport-relative coordinates (fixed positioning)
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        })
        setSelectedText(text)
      } else {
        setPosition(null)
      }
    }

    // BUG FIX: assign the handler to a named variable so removal works
    const handleMouseDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest('#highlight-toolbar')) {
        // Only clear if the toolbar is currently shown — avoids clearing on
        // accidental clicks when nothing is selected.
        if (positionRef.current) {
          setPosition(null)
          setSaveStatus(null)
        }
      }
    }

    document.addEventListener('selectionchange', handleSelection)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('selectionchange', handleSelection)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  if (!position) return null

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const handleShareX = () => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`"${selectedText}"\n\n`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
    setPosition(null)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${selectedText}"\n\n- Read more: ${window.location.href}`)
    setPosition(null)
  }

  const handleSaveNote = async () => {
    setIsSaving(true)

    // Derive a clean post title from the <h1> on the page (best-effort)
    const h1 = document.querySelector('h1')
    const postTitle = h1?.textContent?.trim() ?? undefined

    // Save the canonical pathname (e.g. /blog/my-post) so we can reconstruct
    // the text-fragment deep-link URL at display time.
    const result = await saveNote(selectedText, window.location.pathname, selectedText, postTitle)

    setIsSaving(false)

    if (result.success) {
      setSaveStatus('Saved!')
      setTimeout(() => {
        setPosition(null)
        setSaveStatus(null)
      }, 1500)
    } else {
      setSaveStatus(result.reason === 'Not authenticated' ? 'Login required' : 'Failed')
      setTimeout(() => setSaveStatus(null), 2500)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      id="highlight-toolbar"
      className="animate-in fade-in zoom-in-95 pointer-events-auto fixed z-50 flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm shadow-2xl transition-all duration-200"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {/* Share on X */}
      <button
        onClick={handleShareX}
        title="Share on X (Twitter)"
        className="flex items-center gap-2 rounded-lg px-2.5 py-1 font-semibold text-white transition hover:bg-gray-800"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Quote
      </button>

      <div className="h-5 w-px bg-gray-700" />

      {/* Copy */}
      <button
        onClick={handleCopy}
        title="Copy to clipboard"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold text-gray-300 transition hover:bg-gray-800 hover:text-white"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        Copy
      </button>

      <div className="h-5 w-px bg-gray-700" />

      {/* Save note */}
      <button
        onClick={handleSaveNote}
        disabled={isSaving || saveStatus !== null}
        title="Save to My Notebook"
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
          saveStatus === 'Saved!'
            ? 'bg-green-900/40 text-green-400'
            : saveStatus === 'Login required'
              ? 'bg-red-900/40 text-red-400'
              : saveStatus === 'Failed'
                ? 'bg-red-900/40 text-red-400'
                : 'text-primary-400 hover:text-primary-300 hover:bg-gray-800'
        }`}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
        {isSaving ? 'Saving…' : saveStatus || 'Save'}
      </button>

      {/* Downward caret */}
      <div className="absolute top-full left-1/2 -mt-px -ml-2 border-[8px] border-transparent border-t-gray-900 drop-shadow-sm" />
    </div>
  )
}
