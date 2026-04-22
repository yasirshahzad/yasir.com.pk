/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import AIWritingPanel from '@/components/AIWritingPanel'
import ImageUploader from '@/components/ImageUploader'
import FloatingToolbar from '@/components/FloatingToolbar'
import dynamic from 'next/dynamic'
import { useRef, useState, useMemo, useCallback } from 'react'
import { savePostAction, deletePostAction } from './actions'
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
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const editorRef = useRef<any>(null)

  const handleAIInsert = useCallback((text: string) => {
    setContent((prev: string) => prev + '\n\n' + text)
    // Keep panel open so the user can keep generating
  }, [])

  // Editor options for a professional experience
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
      // Restored preview with stable 'marked' v4 rendering
      previewRender: (plainText: string, preview: HTMLElement) => {
        if (preview) {
          // Add website's prose classes for styling
          preview.classList.add('prose', 'dark:prose-invert', 'max-w-none', 'p-4')

          // Use marked to render the actual markdown safely
          return marked.parse(plainText)
        }
        return ''
      },
    }
  }, [])

  return (
    <form action={savePostAction} className="space-y-6">
      <link
        rel="stylesheet"
        href={FONT_AWESOME_URL}
        preconnect-href="https://maxcdn.bootstrapcdn.com"
      />
      <input type="hidden" name="isEditing" value={isEditing ? 'true' : 'false'} />
      {isEditing && <input type="hidden" name="originalSlug" value={post.slug} />}

      <input type="hidden" name="content" value={content} />

      {/* Grid for metadata */}
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
            className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800"
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
            className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Date
          </label>
          <input
            type="datetime-local"
            name="date"
            id="date"
            defaultValue={
              post?.date
                ? new Date(post.date).toISOString().slice(0, 16)
                : new Date().toISOString().slice(0, 16)
            }
            required
            className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Tags (comma separated)
          </label>
          <input
            type="text"
            name="tags"
            id="tags"
            defaultValue={post?.tags?.join(', ')}
            placeholder="news, tech, lifestyle"
            className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="authors"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Authors (comma separated)
          </label>
          <input
            type="text"
            name="authors"
            id="authors"
            defaultValue={post?.authors?.join(', ') || 'default'}
            className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="layout"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Layout
          </label>
          <select
            name="layout"
            id="layout"
            defaultValue={post?.layout || 'PostLayout'}
            className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="PostLayout">Standard</option>
            <option value="PostSimple">Simple</option>
            <option value="PostBanner">Banner</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="draft"
            id="draft"
            defaultChecked={post?.draft}
            className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="draft" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Keep as Draft
          </label>
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
          className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content (WYSIWYG Markdown Editor)
          </h3>
          <div className="flex items-center gap-2">
            <ImageUploader 
              onUploadSuccess={(url) => {
                setContent(prev => prev + `\n\n![Image Description](${url})\n\n`)
              }} 
            />
            <button
              type="button"
              onClick={() => setAiPanelOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
            options={{
              ...editorOptions,
              toolbar: false, // Hide default toolbar to use our floating one
            }}
          />
        </div>
      </div>

      {/* Floating Toolbar for Admin Form */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
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
          onHeading={(level) => {
            const cm = editorRef.current
            const line = cm.getLine(cm.getCursor().line)
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
            const cursor = cm.getCursor()
            cm.replaceRange(`\n\n![Image Description](${url})\n\n`, cursor)
            cm.focus()
          }}
          onDiagram={() => {
             setAiPanelOpen(true)
          }}
          onCallout={(type) => {
            const cm = editorRef.current
            const selection = cm.getSelection()
            cm.replaceSelection(`\n\n> [!${type}]\n> ${selection || 'Update this message...'}\n\n`)
            cm.focus()
          }}
          onAI={() => setAiPanelOpen(!aiPanelOpen)}
          showSaveButtons={false} // PostForm has separate submit button
          aiActive={aiPanelOpen}
        />
      </div>

      <div className="flex items-center justify-between pt-4">
        {isEditing && (
          <button
            type="button"
            onClick={async () => {
              if (confirm('Are you sure you want to delete this post?')) {
                await deletePostAction(post.slug)
              }
            }}
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-red-900/50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Delete Post
          </button>
        )}
        <div className="ml-auto flex space-x-4">
          <a
            href="/admin"
            className="focus:ring-primary-500 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 dark:hover:bg-primary-400 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
          >
            {isEditing ? 'Update Post' : 'Save Post'}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .editor-toolbar {
          background: white;
          border-color: #d1d5db;
          border-radius: 0.375rem 0.375rem 0 0;
        }
        .CodeMirror {
          border-color: #d1d5db;
          border-radius: 0 0 0.375rem 0.375rem;
          min-height: 500px;
        }
        .dark .editor-toolbar {
          background: #111827;
          border-color: #374151;
          color: white;
        }
        .dark .editor-toolbar button {
          color: white !important;
        }
        .dark .editor-toolbar button.active,
        .dark .editor-toolbar button:hover {
          background: #1f2937;
        }
        .dark .CodeMirror {
          background: #111827;
          color: #f3f4f6;
          border-color: #374151;
        }
        .dark .editor-preview-side {
          background: #111827;
          border-color: #374151;
          color: #f3f4f6;
        }
        .editor-preview-side.prose,
        .editor-preview.prose {
          max-width: none !important;
        }
      `}</style>

      {/* AI Panel — rendered as a fixed right-side drawer in admin context */}
      {aiPanelOpen && (
        <>
          {/* Clickable overlay (no blur) to close */}
          <div
            className="fixed inset-0 z-[200]"
            onClick={() => setAiPanelOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md z-[201] shadow-2xl">
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
