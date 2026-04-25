/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ImageUploader from './ImageUploader'
import MediaLibrary from './MediaLibrary'
import SEOPreview from './SEOPreview'

interface AIWritingPanelProps {
  isOpen: boolean
  onClose: () => void
  currentContent: string
  selectedText: string // text selected in the blog editor
  onInsert: (text: string) => void
  onReplaceSelection: (text: string) => void
  onSendToAI: () => void // parent signals that selectedText was pushed
  title?: string
  slug?: string
  summary?: string
  images?: string[]
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
  title = '',
  slug = '',
  summary = '',
  images = [],
}: AIWritingPanelProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'media' | 'seo'>('write')
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
  }, [isOpen, model])

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
    <div className="flex h-full w-full flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <svg
              className="h-3.5 w-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xs leading-none font-bold text-gray-900 dark:text-white">
              AI Writing Assistant
            </h2>
            <p className="mt-0.5 text-[9px] tracking-wider text-gray-400 uppercase">
              {model || 'Ollama'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isGenerating}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-100 bg-gray-50/50 p-1 dark:border-gray-800 dark:bg-gray-900/50">
        <button
          onClick={() => setActiveTab('write')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-bold tracking-widest uppercase transition-all ${
            activeTab === 'write'
              ? 'bg-white text-purple-600 shadow-sm dark:bg-gray-800 dark:text-purple-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          Write
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-bold tracking-widest uppercase transition-all ${
            activeTab === 'media'
              ? 'bg-white text-purple-600 shadow-sm dark:bg-gray-800 dark:text-purple-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          Library
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-bold tracking-widest uppercase transition-all ${
            activeTab === 'seo'
              ? 'bg-white text-purple-600 shadow-sm dark:bg-gray-800 dark:text-purple-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          SEO
        </button>
      </div>

      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {activeTab === 'write' ? (
          <>
            {/* Context from blog post */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                  Context from Post
                </span>
                {context && (
                  <button
                    type="button"
                    onClick={() => setContext('')}
                    className="text-[9px] font-bold tracking-wider text-gray-400 uppercase hover:text-red-400"
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
                className="w-full resize-none rounded-lg border border-gray-200 bg-violet-50/50 px-3 py-2 text-xs placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:bg-violet-900/10"
              />
            </div>

            {/* Model Selector */}
            <div>
              <span className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Model
              </span>
              {modelsLoading ? (
                <div className="text-xs text-gray-400">Loading models…</div>
              ) : models.length === 0 ? (
                <div className="text-xs text-amber-500">
                  No Ollama models found. Run{' '}
                  <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">
                    ollama pull llama3
                  </code>{' '}
                  first.
                </div>
              ) : (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800"
                >
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Mode Selector */}
            <div>
              <span className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Mode
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'generate', label: 'Generate', icon: '✨' },
                  { value: 'rewrite', label: 'Rewrite', icon: '✏️' },
                  { value: 'continue', label: 'Continue', icon: '→' },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value as any)}
                    className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${
                      mode === m.value
                        ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-700'
                        : 'dark:hover:bg-gray-750 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
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
              <span className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Reference Posts (max 3)
              </span>

              {selectedRefs.length > 0 && (
                <div className="mb-2 space-y-1">
                  {selectedRefs.map((ref) => (
                    <div
                      key={ref.slug}
                      className="flex items-center justify-between rounded-lg bg-purple-50 px-2.5 py-1.5 text-[11px] dark:bg-purple-900/20"
                    >
                      <span className="truncate pr-2 font-medium text-purple-700 dark:text-purple-300">
                        {ref.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRef(ref.slug)}
                        className="shrink-0 text-purple-400 hover:text-red-500"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
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
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSearch(true)
                    }}
                    onFocus={() => setShowSearch(true)}
                    placeholder="Search posts to reference…"
                    className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 text-xs focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800"
                  />
                  <svg
                    className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                      {searchResults.map((post) => (
                        <button
                          key={post.slug}
                          type="button"
                          onClick={() => addRef(post)}
                          className="dark:hover:bg-gray-750 w-full border-b border-gray-50 px-3 py-2 text-left text-xs transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800"
                        >
                          <div className="truncate font-medium text-gray-900 dark:text-gray-100">
                            {post.title}
                          </div>
                          <div className="mt-0.5 text-[9px] text-gray-400">{post.slug}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Media Upload */}
            <div>
              <span className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Quick Image Upload
              </span>
              <div className="flex items-center gap-2">
                <ImageUploader
                  label="Upload Asset"
                  onUploadSuccess={(url) => {
                    setInstruction((prev) => prev + ` (Ref: ${url})`)
                    setOutput(url)
                  }}
                />
                <p className="text-[9px] text-gray-400">Upload to Supabase and get URL</p>
              </div>
            </div>

            {/* Instruction */}
            <div>
              <span className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Instruction
              </span>
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
                    ? 'Write an introduction about distributed caching strategies...'
                    : mode === 'rewrite'
                      ? 'Make it more concise and add code examples...'
                      : 'Add a section about cache invalidation patterns...'
                }
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800"
              />
              <p className="mt-1 text-[9px] text-gray-400">Ctrl+Enter to generate</p>
            </div>

            {/* Generate / Stop Button */}
            <div>
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-600"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                  Stop Generating
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!instruction.trim() || (models.length === 0 && !model)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-bold text-white transition-all hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate with AI
                </button>
              )}
            </div>
          </>
        ) : activeTab === 'media' ? (
          <div className="space-y-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Asset Gallery
              </span>
            </div>
            <MediaLibrary
              onSelect={(url) => {
                onInsert(`![Image](${url})`)
                setActiveTab('write')
              }}
            />
            <p className="rounded bg-gray-50 p-2 text-[9px] text-gray-400 italic dark:bg-gray-900/50">
              Click an image to insert it into your post.
            </p>
          </div>
        ) : (
          <SEOPreview title={title} summary={summary} slug={slug} image={images[0]} />
        )}
      </div>

      {/* ── Output ──────────────────────────────────────────────────────── */}
      {output && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Output
            </span>
            <div className="flex items-center gap-2">
              {!isGenerating && (
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="text-[9px] font-bold tracking-wider text-gray-400 uppercase hover:text-purple-500"
                >
                  Copy
                </button>
              )}
              <button
                type="button"
                onClick={() => setOutput('')}
                className="text-[9px] font-bold tracking-wider text-gray-400 uppercase hover:text-red-400"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Editable output — user can trim/tweak before inserting */}
          <div
            ref={outputRef}
            className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-gray-800 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200"
          >
            {output}
            {isGenerating && (
              <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-purple-500" />
            )}
          </div>


          {/* Action row */}
          {!isGenerating && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {/* Replace the selected text in the editor with AI output */}
              <button
                type="button"
                onClick={handleReplaceSelection}
                disabled={!context}
                title={
                  context
                    ? 'Replace the selected text in the editor'
                    : 'Select text in the editor first'
                }
                className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-amber-400 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Replace Selection
              </button>

              {/* Append AI output at the end of the editor */}
              <button
                type="button"
                onClick={handleInsertAtEnd}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-green-500"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Insert at End
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
