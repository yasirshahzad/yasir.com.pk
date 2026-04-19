/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface AIWritingPanelProps {
  isOpen: boolean
  onClose: () => void
  currentContent: string
  selectedText: string          // text selected in the blog editor
  onInsert: (text: string) => void
  onReplaceSelection: (text: string) => void
  onSendToAI: () => void        // parent signals that selectedText was pushed
}

interface BlogPostRef {
  slug: string
  title: string
}

export default function AIWritingPanel({
  isOpen,
  onClose,
  currentContent,
  selectedText,
  onInsert,
  onReplaceSelection,
}: AIWritingPanelProps) {
  const [instruction, setInstruction] = useState('')
  const [mode, setMode] = useState<'generate' | 'rewrite' | 'continue'>('generate')
  const [model, setModel] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)

  // Context snippet imported from the blog post
  const [context, setContext] = useState('')

  // Reference posts
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BlogPostRef[]>([])
  const [selectedRefs, setSelectedRefs] = useState<BlogPostRef[]>([])
  const [showSearch, setShowSearch] = useState(false)

  // Generation
  const [output, setOutput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  // When the parent passes new selectedText (user selected something), auto-fill context
  useEffect(() => {
    if (selectedText && selectedText.trim().length > 5) {
      setContext(selectedText.trim())
    }
  }, [selectedText])

  // Fetch models on open
  useEffect(() => {
    if (!isOpen) return
    setModelsLoading(true)
    fetch('/api/ai/generate')
      .then((r) => r.json())
      .then((data) => {
        const m = data.models || []
        setModels(m)
        if (m.length > 0 && !model) setModel(m[0])
      })
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false))
  }, [isOpen])

  // Search blog posts
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      fetch('/search.json')
        .then((r) => r.json())
        .then((posts: any[]) => {
          const q = searchQuery.toLowerCase()
          const filtered = posts
            .filter(
              (p) =>
                p.title?.toLowerCase().includes(q) ||
                p.slug?.toLowerCase().includes(q) ||
                p.tags?.some((t: string) => t.toLowerCase().includes(q))
            )
            .slice(0, 8)
            .map((p) => ({ slug: p.slug, title: p.title }))
          setSearchResults(filtered)
        })
        .catch(() => setSearchResults([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addRef = (post: BlogPostRef) => {
    if (selectedRefs.length >= 3) return
    if (selectedRefs.find((r) => r.slug === post.slug)) return
    setSelectedRefs([...selectedRefs, post])
    setSearchQuery('')
    setShowSearch(false)
  }

  const removeRef = (slug: string) => {
    setSelectedRefs(selectedRefs.filter((r) => r.slug !== slug))
  }

  const handleGenerate = useCallback(async () => {
    if (!instruction.trim() || isGenerating) return

    setIsGenerating(true)
    setOutput('')
    abortRef.current = new AbortController()

    // Build the effective content: explicit context snippet takes priority,
    // otherwise fall back to the full article text.
    const effectiveContent = context.trim() || currentContent

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          currentContent: effectiveContent,
          referenceSlugs: selectedRefs.map((r) => r.slug),
          model: model || undefined,
          mode,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Generation failed' }))
        setOutput(`Error: ${err.error || res.statusText}`)
        setIsGenerating(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setOutput('Error: No response stream')
        setIsGenerating(false)
        return
      }

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setOutput(accumulated)
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setOutput(`Error: ${err?.message || 'Generation failed'}`)
      }
    } finally {
      setIsGenerating(false)
      abortRef.current = null
    }
  }, [instruction, currentContent, context, selectedRefs, model, mode, isGenerating])

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const handleInsertAtEnd = () => {
    if (output.trim()) {
      onInsert(output)
      setOutput('')
      setInstruction('')
    }
  }

  const handleReplaceSelection = () => {
    if (output.trim()) {
      onReplaceSelection(output)
      setOutput('')
      setInstruction('')
      setContext('')
    }
  }

  // Close on Escape (only when not generating)
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, isGenerating, onClose])

  if (!isOpen) return null

  return (
    // NO backdrop — panel slides in from right without blocking anything
    <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 w-full">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900 dark:text-white leading-none">AI Writing Assistant</h2>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">
              {model || 'Ollama'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Context from blog post */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Context from Post
            </label>
            {context && (
              <button
                onClick={() => setContext('')}
                className="text-[9px] text-gray-400 hover:text-red-400 uppercase tracking-wider font-bold"
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Select text in the editor, then click 'Send to AI' — or type/paste directly here…"
            rows={3}
            className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 bg-violet-50/50 dark:bg-violet-900/10 focus:ring-purple-500 focus:border-purple-500 resize-none placeholder-gray-400 px-3 py-2"
          />
        </div>

        {/* Model Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Model
          </label>
          {modelsLoading ? (
            <div className="text-xs text-gray-400">Loading models…</div>
          ) : models.length === 0 ? (
            <div className="text-xs text-amber-500">
              No Ollama models found. Run{' '}
              <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">ollama pull llama3</code> first.
            </div>
          ) : (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-purple-500 focus:border-purple-500 px-2 py-1.5"
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>

        {/* Mode Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Mode
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: 'generate', label: 'Generate', icon: '✨' },
              { value: 'rewrite',  label: 'Rewrite',  icon: '✏️'  },
              { value: 'continue', label: 'Continue', icon: '→'   },
            ].map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value as any)}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  mode === m.value
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 ring-1 ring-purple-300 dark:ring-purple-700'
                    : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750'
                }`}
              >
                <span>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reference Posts */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Reference Posts (max 3)
          </label>

          {selectedRefs.length > 0 && (
            <div className="space-y-1 mb-2">
              {selectedRefs.map((ref) => (
                <div
                  key={ref.slug}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-[11px]"
                >
                  <span className="font-medium text-purple-700 dark:text-purple-300 truncate pr-2">
                    {ref.title}
                  </span>
                  <button onClick={() => removeRef(ref.slug)} className="text-purple-400 hover:text-red-500 shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedRefs.length < 3 && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true) }}
                onFocus={() => setShowSearch(true)}
                placeholder="Search posts to reference…"
                className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-purple-500 focus:border-purple-500 pl-8 py-1.5"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-40 overflow-y-auto z-10">
                  {searchResults.map((post) => (
                    <button
                      key={post.slug}
                      onClick={() => addRef(post)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{post.title}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{post.slug}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instruction */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Instruction
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                handleGenerate()
              }
            }}
            placeholder={
              mode === 'generate'
                ? 'Write an introduction about distributed caching…'
                : mode === 'rewrite'
                  ? 'Make it more concise and add code examples…'
                  : 'Add a section about cache invalidation patterns…'
            }
            rows={3}
            className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-purple-500 focus:border-purple-500 resize-none px-3 py-2"
          />
          <p className="text-[9px] text-gray-400 mt-1">Ctrl+Enter to generate</p>
        </div>

        {/* Generate / Stop Button */}
        <div>
          {isGenerating ? (
            <button
              onClick={handleStop}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Stop Generating
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!instruction.trim() || (models.length === 0 && !model)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white rounded-lg text-xs font-bold transition-all disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate with AI
            </button>
          )}
        </div>

        {/* ── Output ──────────────────────────────────────────────────────── */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Output
              </label>
              <div className="flex items-center gap-2">
                {!isGenerating && (
                  <button
                    onClick={() => navigator.clipboard.writeText(output)}
                    className="text-[9px] font-bold text-gray-400 hover:text-purple-500 uppercase tracking-wider"
                  >
                    Copy
                  </button>
                )}
                <button
                  onClick={() => setOutput('')}
                  className="text-[9px] font-bold text-gray-400 hover:text-red-400 uppercase tracking-wider"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Editable output — user can trim/tweak before inserting */}
            <div
              ref={outputRef}
              className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-56 overflow-y-auto text-xs text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap leading-relaxed"
            >
              {output}
              {isGenerating && (
                <span className="inline-block w-1.5 h-3.5 bg-purple-500 animate-pulse ml-0.5" />
              )}
            </div>

            {/* Action row */}
            {!isGenerating && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {/* Replace the selected text in the editor with AI output */}
                <button
                  onClick={handleReplaceSelection}
                  disabled={!context}
                  title={context ? 'Replace the selected text in the editor' : 'Select text in the editor first'}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg text-[11px] font-bold transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Replace Selection
                </button>

                {/* Append AI output at the end of the editor */}
                <button
                  onClick={handleInsertAtEnd}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-[11px] font-bold transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Insert at End
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
