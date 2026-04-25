/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import AIWritingPanel from '@/components/AIWritingPanel'
import ImageUploader from '@/components/ImageUploader'
import FloatingToolbar from '@/components/FloatingToolbar'
import dynamic from 'next/dynamic'
import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import {
  savePostAction,
  deletePostAction,
  getRevisionsAction,
  restoreRevisionAction,
  autoSavePostAction,
} from './actions'
import 'easymde/dist/easymde.min.css'
import { marked } from 'marked'

// Dynamically import the editor to prevent SSR errors
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false })

// Font Awesome is required for the editor icons
const FONT_AWESOME_URL =
  'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'

interface PostFormProps {
  post?: any
  isEditing?: boolean
}

export default function PostForm({ post, isEditing }: PostFormProps) {
  const [content, setContent] = useState(post?.content || '')
  const [title, setTitle] = useState(post?.title || '')
  const [summary, setSummary] = useState(post?.summary || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [status, setStatus] = useState(post?.status || 'draft')
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'analytics' | 'revisions'>(
    'content'
  )
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const editorRef = useRef<any>(null)

  const [revisions, setRevisions] = useState<any[]>([])
  const [loadingRevisions, setLoadingRevisions] = useState(false)

  const fetchRevisions = useCallback(async () => {
    if (!post?.id) return
    setLoadingRevisions(true)
    try {
      const revs = await getRevisionsAction(post.id)
      setRevisions(revs)
    } catch (e) {
      console.error('Failed to fetch revisions', e)
    } finally {
      setLoadingRevisions(false)
    }
  }, [post?.id])

  useEffect(() => {
    if (activeTab === 'revisions' && isEditing) {
      fetchRevisions()
    }
  }, [activeTab, fetchRevisions, isEditing])

  const handleRestore = async (revisionId: number) => {
    if (confirm('Restore this version? Current unsaved changes will be lost.')) {
      try {
        await restoreRevisionAction(revisionId)
        window.location.reload()
      } catch (e) {
        alert('Failed to restore revision')
      }
    }
  }

  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditing || !slug) return

    const timer = setTimeout(async () => {
      setIsAutoSaving(true)
      const result = await autoSavePostAction(post.slug, {
        title,
        content,
        summary,
        status,
      })
      if (result.success) {
        setLastAutoSaved(new Date().toLocaleTimeString())
      }
      setIsAutoSaving(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [content, title, summary, status, isEditing, slug, post?.slug])

  const handleAIInsert = useCallback((text: string) => {
    setContent((prev: string) => prev + '\n\n' + text)
  }, [])

  const editorOptions = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
      placeholder: 'Write your masterpiece here...',
      status: ['lines', 'words', 'cursor'],
      toolbar: [
        'bold',
        'italic',
        'heading',
        '|',
        'quote',
        'unordered-list',
        'ordered-list',
        '|',
        'link',
        'image',
        'table',
        '|',
        'preview',
        'side-by-side',
        'fullscreen',
        '|',
        'guide',
      ],
      renderingConfig: {
        singleLineBreaks: false,
        codeSyntaxHighlighting: true,
      },
      previewRender: (plainText: string, preview: HTMLElement) => {
        if (preview) {
          preview.classList.add('prose', 'dark:prose-invert', 'max-w-none', 'p-4')
          return marked.parse(plainText)
        }
        return ''
      },
    }
  }, [])

  return (
    <form action={savePostAction} className="space-y-6">
      <link rel="stylesheet" href={FONT_AWESOME_URL} />
      <input type="hidden" name="isEditing" value={isEditing ? 'true' : 'false'} />
      {isEditing && <input type="hidden" name="originalSlug" value={post.slug} />}
      <input type="hidden" name="content" value={content} />

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {(['content', 'seo', 'analytics', 'revisions'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              } `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'content' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Slug
              </label>
              <input
                type="text"
                name="slug"
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Status
              </label>
              <select
                name="status"
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {(status === 'published' || status === 'scheduled') && (
              <div className="animate-in fade-in space-y-2 duration-300">
                <label
                  htmlFor="publishedAt"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {status === 'scheduled' ? 'Scheduled Date' : 'Publish Date'}
                </label>
                <input
                  type="datetime-local"
                  name="publishedAt"
                  id="publishedAt"
                  defaultValue={
                    post?.publishedAt
                      ? new Date(post.publishedAt).toISOString().slice(0, 16)
                      : new Date().toISOString().slice(0, 16)
                  }
                  className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Tags
              </label>
              <input
                type="text"
                name="tags"
                id="tags"
                defaultValue={post?.tags?.join(', ')}
                placeholder="news, tech"
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="categories"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Categories
              </label>
              <input
                type="text"
                name="categories"
                id="categories"
                defaultValue={post?.categories?.join(', ')}
                placeholder="Software, Life"
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="summary"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Summary
            </label>
            <textarea
              name="summary"
              id="summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Content
              </h3>
              <div className="flex items-center gap-2">
                <ImageUploader
                  onUploadSuccess={(url) => setContent((prev) => prev + `\n\n![Image](${url})\n\n`)}
                />
                <button
                  type="button"
                  onClick={() => setAiPanelOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90"
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
                  AI Assistant
                </button>
              </div>
            </div>
            <div className="prose-editor dark:prose-invert">
              <SimpleMDE
                value={content}
                onChange={setContent}
                getMdeInstance={(instance) => {
                  editorRef.current = instance.codemirror
                }}
                // @ts-ignore
                options={{ ...editorOptions, toolbar: false }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 max-w-2xl space-y-6 duration-300">
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="metaTitle"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Meta Title
              </label>
              <input
                type="text"
                name="metaTitle"
                id="metaTitle"
                defaultValue={post?.metaTitle}
                placeholder="SEO Title (defaults to post title)"
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="metaDescription"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Meta Description
              </label>
              <textarea
                name="metaDescription"
                id="metaDescription"
                rows={3}
                defaultValue={post?.metaDescription}
                placeholder="Brief description for search results..."
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="canonicalUrl"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Canonical URL
              </label>
              <input
                type="url"
                name="canonicalUrl"
                id="canonicalUrl"
                defaultValue={post?.canonicalUrl}
                placeholder="https://original-source.com/..."
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="ogImage"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                OG Image URL
              </label>
              <input
                type="text"
                name="ogImage"
                id="ogImage"
                defaultValue={post?.ogImage}
                placeholder="Image URL for social sharing"
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
            <h4 className="mb-2 text-sm font-semibold dark:text-gray-200">Search Preview</h4>
            <div className="space-y-1">
              <div className="cursor-pointer truncate text-lg text-blue-700 hover:underline dark:text-blue-400">
                {post?.metaTitle || title || 'Post Title'}
              </div>
              <div className="text-sm text-green-700 dark:text-green-500">
                yasir.com.pk/blog/{slug || 'post-slug'}
              </div>
              <div className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                {post?.metaDescription || summary || 'Post summary goes here...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 grid grid-cols-1 gap-6 duration-300 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</dt>
            <dd className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              {post?.viewCount || 0}
            </dd>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Reading Time</dt>
            <dd className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              {post?.readingTime || 0} min
            </dd>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Words</dt>
            <dd className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              {content.split(/\s+/).filter(Boolean).length}
            </dd>
          </div>
        </div>
      )}

      {activeTab === 'revisions' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
          {!isEditing ? (
            <div className="py-12 text-center text-gray-500">
              Revisions are only available for existing posts.
            </div>
          ) : loadingRevisions ? (
            <div className="py-12 text-center">
              <div className="border-primary-500 mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
            </div>
          ) : revisions.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 py-12 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <p>No revisions found yet. Updates will create history.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Title
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {revisions.map((rev) => (
                    <tr
                      key={rev.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {new Date(rev.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">
                        {rev.title}
                      </td>
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRestore(rev.id)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 font-bold"
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Floating Toolbar for Admin Form */}
      <div className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2">
        <FloatingToolbar
          onBold={() => {
            const cm = editorRef.current
            const selection = cm.getSelection()
            cm.replaceSelection(`**${selection}**`)
            cm.focus()
          }}
          onItalic={() => {
            const cm = editorRef.current
            const selection = cm.getSelection()
            cm.replaceSelection(`_${selection}_`)
            cm.focus()
          }}
          onHeading={(level: 2 | 3) => {
            const cm = editorRef.current
            cm.replaceRange(`${'#'.repeat(level)} `, { line: cm.getCursor().line, ch: 0 })
            cm.focus()
          }}
          onLink={() => {
            const url = prompt('Enter URL:')
            if (url) {
              const cm = editorRef.current
              const selection = cm.getSelection()
              cm.replaceSelection(`[${selection || 'link'}](${url})`)
              cm.focus()
            }
          }}
          onImage={(url) => {
            const cm = editorRef.current
            cm.replaceRange(`\n\n![Image](${url})\n\n`, cm.getCursor())
            cm.focus()
          }}
          onCallout={(type) => {
            const cm = editorRef.current
            const selection = cm.getSelection()
            cm.replaceSelection(`\n\n> [!${type}]\n> ${selection || 'Message...'}\n\n`)
            cm.focus()
          }}
          onAI={() => setAiPanelOpen(!aiPanelOpen)}
          showSaveButtons={false}
          aiActive={aiPanelOpen}
        />
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
        {isEditing && (
          <button
            type="button"
            onClick={async () => {
              if (confirm('Delete this post permanently?')) {
                await deletePostAction(post.slug)
              }
            }}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:bg-gray-800 dark:text-red-400"
          >
            Delete Post
          </button>
        )}
        <div className="ml-auto flex items-center space-x-4">
          {isEditing && (
            <div className="mr-2 flex items-center gap-2 text-xs text-gray-500 transition-all dark:text-gray-400">
              {isAutoSaving ? (
                <>
                  <div className="bg-primary-500 h-1.5 w-1.5 animate-pulse rounded-full"></div>
                  Saving...
                </>
              ) : lastAutoSaved ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Last auto-saved: {lastAutoSaved}
                </>
              ) : null}
            </div>
          )}
          <a
            href="/admin"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 rounded-lg px-6 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isEditing ? 'Update Post' : 'Create Post'}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .CodeMirror {
          border-color: #d1d5db;
          border-radius: 0.75rem;
          min-height: 600px;
          font-family: inherit;
          padding: 1rem;
        }
        .dark .CodeMirror {
          background: #111827;
          color: #f3f4f6;
          border-color: #374151;
        }
        .editor-preview-side.prose,
        .editor-preview.prose {
          max-width: none !important;
        }
      `}</style>

      {aiPanelOpen && (
        <>
          <div
            className="fixed inset-0 z-[200]"
            onClick={() => setAiPanelOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setAiPanelOpen(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close AI Panel"
          />

          <div className="fixed top-0 right-0 z-[201] h-full w-full max-w-md shadow-2xl">
            <AIWritingPanel
              isOpen={aiPanelOpen}
              onClose={() => setAiPanelOpen(false)}
              currentContent={content}
              selectedText=""
              onInsert={handleAIInsert}
              onReplaceSelection={handleAIInsert}
              onSendToAI={() => {}}
              title={title}
              summary={summary}
              slug={slug}
              images={post?.images}
            />
          </div>
        </>
      )}
    </form>
  )
}
