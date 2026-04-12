import { getReaderNotes } from 'app/actions/noteActions'
import Link from 'next/link'
import SectionContainer from '@/components/SectionContainer'
import siteMetadata from '@/data/siteMetadata'

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
          <span className="text-6xl mb-6 opacity-80">🔐</span>
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            Members Only
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            You must be logged in to access and manage your private notebook.
          </p>
          <Link
            href="/login"
            className="mt-8 rounded-lg bg-primary-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-primary-700"
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
        <div className="space-y-2 pt-6 pb-2 md:space-y-5 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            My Notebook 💾
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            A curated list of insights you have actively captured while reading.
          </p>
        </div>
        
        {notes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <span className="text-4xl block mb-4 opacity-70">🧭</span>
            <h3 className="text-xl font-bold dark:text-gray-200">No notes yet.</h3>
            <p className="text-gray-500 mt-2">
              Highlight any text while reading an article, and click 'Save' to collect insights here!
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="break-inside-avoid rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-700/10 dark:bg-primary-900/40 dark:text-primary-400">
                    {new Date(note.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                
                <p className="border-l-4 border-primary-500 pl-4 py-1 text-gray-800 dark:text-gray-200 italic font-medium">
                  {note.quote}
                </p>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <Link 
                    href={note.sourceUrl}
                    className="text-sm font-semibold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition"
                  >
                    Return to source &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionContainer>
  )
}
