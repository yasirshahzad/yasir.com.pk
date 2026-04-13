'use client'

import { useEffect, useState } from 'react'

export default function HighlightToShare() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

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
        // Only trigger for meaningful selections
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        // Position it explicitly above the center of the selection
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        })
        setSelectedText(text)
      } else {
        setPosition(null)
      }
    }

    document.addEventListener('selectionchange', handleSelection)
    // Clear on mousedown outside
    document.addEventListener('mousedown', (e) => {
      if (!(e.target as Element).closest('#highlight-toolbar')) {
        setPosition(null)
      }
    })

    return () => {
      document.removeEventListener('selectionchange', handleSelection)
    }
  }, [])

  if (!position) return null

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
    // Dynamic import to avoid SSR issues if any, but since it's a server action, static import is cleaner.
    // We didn't import it at the top, let's do it now.
    setIsSaving(true)
    const { saveNote } = await import('app/actions/noteActions')
    const result = await saveNote(selectedText, window.location.pathname)
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
      <button
        onClick={handleShareX}
        className="flex items-center gap-2 rounded-lg px-2.5 py-1 font-semibold text-white transition hover:bg-gray-800"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
        </svg>
        Quote
      </button>

      <div className="h-5 w-px bg-gray-700"></div>

      <button
        onClick={handleCopy}
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

      <div className="h-5 w-px bg-gray-700"></div>

      <button
        onClick={handleSaveNote}
        disabled={isSaving || saveStatus !== null}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
          saveStatus === 'Saved!'
            ? 'bg-green-900/40 text-green-400'
            : saveStatus === 'Login required'
              ? 'bg-red-900/40 text-red-400'
              : 'text-primary-400 hover:text-primary-300 hover:bg-gray-800'
        }`}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
        {isSaving ? 'Saving...' : saveStatus || 'Save'}
      </button>

      {/* Downward Caret Arrow */}
      <div className="absolute top-full left-1/2 -mt-px -ml-2 border-[8px] border-transparent border-t-gray-900 drop-shadow-sm"></div>
    </div>
  )
}
