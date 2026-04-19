'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteNote } from 'app/actions/noteActions'

interface NoteRow {
  id: number
  quote: string
  sourceUrl: string
  highlightText?: string | null
  postTitle?: string | null
  createdAt?: Date | null
}

interface Props {
  note: NoteRow
}

/**
 * Builds a URL that uses the browser's Text Fragment API so that when the
 * user navigates to the source post, the browser automatically scrolls to
 * and highlights the saved text.
 *
 * Format:  /blog/my-slug#:~:text=first%20few%20words
 *
 * The spec recommends using only the first ~50 characters of the fragment to
 * keep the URL short while still being unique enough to find the passage.
 */
function buildDeepLink(pathname: string, highlightText: string | null | undefined): string {
  if (!highlightText) return pathname

  // Use the first ~60 chars, trim to the last full word to avoid partial names
  const raw = highlightText.slice(0, 60).replace(/\s\S*$/, '').trim()
  const fragment = encodeURIComponent(raw)
  return `${pathname}#:~:text=${fragment}`
}

export default function NoteCard({ note }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  const deepLink = buildDeepLink(note.sourceUrl, note.highlightText ?? note.quote)

  const handleNoteClick = () => {
    // Navigate programmatically so the text fragment hash is respected
    window.location.href = deepLink
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Don't trigger the card click
    if (!confirm('Delete this note?')) return
    setDeleting(true)
    const result = await deleteNote(note.id)
    if (result.success) {
      setDeleted(true)
      router.refresh()
    } else {
      setDeleting(false)
      alert('Failed to delete note. Please try again.')
    }
  }

  if (deleted) return null

  return (
    <div
      onClick={handleNoteClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleNoteClick()}
      className="group break-inside-avoid cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-lg hover:border-primary-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-700"
    >
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <span className="bg-primary-50 text-primary-700 ring-primary-700/10 dark:bg-primary-900/40 dark:text-primary-400 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
          {new Date(note.createdAt!).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete note"
          title="Delete this note"
          className="ml-2 flex items-center rounded-md p-1 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          {deleting ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Note quote */}
      <p className="border-primary-500 border-l-4 py-1 pl-4 font-medium text-gray-800 italic dark:text-gray-200">
        {note.quote}
      </p>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
        {note.postTitle && (
          <span className="max-w-[60%] truncate text-xs text-gray-400 dark:text-gray-500">
            {note.postTitle}
          </span>
        )}
        <span className="text-primary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 ml-auto flex items-center gap-1 text-sm font-semibold transition">
          Read &amp; highlight
          <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  )
}
