/* eslint-disable @typescript-eslint/no-explicit-any */
import { getReaderNotes } from 'app/actions/noteActions'
import Link from 'next/link'
import SectionContainer from '@/components/SectionContainer'
import siteMetadata from '@/data/siteMetadata'
import NoteCard from './NoteCard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: `My Notebook - ${siteMetadata.title}`,
  description: 'Your personal collection of highlights and captured insights.',
}

export default async function NotesDashboard() {
  const notes = await getReaderNotes()

  if (!notes) {
    return (
      <SectionContainer>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="mb-6 text-6xl opacity-80">🔐</span>
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            Members Only
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            You must be logged in to access and manage your private notebook.
          </p>
          <Link
            href="/login"
            className="bg-primary-600 hover:bg-primary-700 mt-8 rounded-lg px-6 py-3 text-lg font-semibold text-white transition"
          >
            Authenticate Now
          </Link>
        </div>
      </SectionContainer>
    )
  }

  return (
    <SectionContainer>
      <div className="space-y-8 pt-6 pb-8 md:space-y-12">
        <div className="space-y-2 border-b border-gray-200 pt-6 pb-2 md:space-y-5 dark:border-gray-700">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            My Notebook 💾
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            A curated list of insights you have actively captured while reading. Click any note to
            jump back — the highlighted text will be automatically located on the page.
          </p>
        </div>

        {notes.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center dark:border-gray-800">
            <span className="mb-4 block text-4xl opacity-70">🧭</span>
            <h3 className="text-xl font-bold dark:text-gray-200">No notes yet.</h3>
            <p className="mt-2 text-gray-500">
              Highlight any text while reading an article, and click &apos;Save&apos; to collect
              insights here!
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note as any} />
            ))}
          </div>
        )}
      </div>
    </SectionContainer>
  )
}
