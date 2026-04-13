/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { fetchRenderedPost } from '../app/actions/publicActions'

export default function InlineReader() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchData, setSearchData] = useState<any[]>([])

  const [activeArticle, setActiveArticle] = useState<{ title: string; html: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch index once upon mounting
  useEffect(() => {
    fetch('/search.json')
      .then((res) => res.json())
      .then((data) => setSearchData(data))
      .catch((err) => console.error('Failed to load inline dictionary index', err))
  }, [])

  // Basic client-side filtering
  const filteredResults = searchData
    .filter((post) => {
      const term = searchTerm.toLowerCase()
      return post.title?.toLowerCase().includes(term) || post.summary?.toLowerCase().includes(term)
    })
    .slice(0, 5) // Limit to 5 results for clean UI

  const handleReadPost = async (slug: string) => {
    setIsLoading(true)
    const result = await fetchRenderedPost(slug)
    if (result.success && result.html) {
      setActiveArticle({
        title: result.title || 'Article',
        html: result.html,
      })
    } else {
      alert('Could not load article.')
    }
    setIsLoading(false)
  }

  const closePanel = () => {
    setIsOpen(false)
    // Optional: reset state on close
    setTimeout(() => {
      setSearchTerm('')
      setActiveArticle(null)
    }, 300)
  }

  return (
    <>
      {/* Search Trigger Button matching ScrollTopAndComment styles */}
      <button
        aria-label="Quick Glossary Search"
        title="Quick Glossary Search / Dictionary"
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-gray-200 p-2 text-gray-500 transition-all hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closePanel}>
          {/* Overlay */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                {/* Slide-over Panel */}
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300 sm:duration-400"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300 sm:duration-400"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl transform transition-all">
                    <div className="flex h-full flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-6 sm:px-6 dark:border-gray-700 dark:bg-gray-800/50">
                        <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {activeArticle ? 'Inline Reader' : 'Quick Glossary Search'}
                        </Dialog.Title>
                        <button
                          type="button"
                          className="focus:ring-primary-500 rounded-md text-gray-400 hover:text-gray-500 focus:ring-2 focus:outline-none"
                          onClick={closePanel}
                        >
                          <span className="sr-only">Close panel</span>
                          <span className="text-2xl">&times;</span>
                        </button>
                      </div>

                      {/* Dynamic Body */}
                      <div className="no-scrollbar relative flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                        {/* VIEW: Search */}
                        {!activeArticle && (
                          <div className="space-y-6">
                            <input
                              type="text"
                              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                              placeholder="Type a system design term..."
                              value={searchTerm}
                              // eslint-disable-next-line jsx-a11y/no-autofocus
                              autoFocus
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <div className="space-y-4">
                              {searchTerm.length > 0 ? (
                                filteredResults.length > 0 ? (
                                  filteredResults.map((post) => (
                                    <button
                                      key={post.slug}
                                      onClick={() => handleReadPost(post.slug)}
                                      className="group hover:border-primary-500 dark:hover:border-primary-500 block w-full cursor-pointer rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                    >
                                      <h3 className="text-primary-500 text-lg font-bold">
                                        {post.title}
                                      </h3>
                                      <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                                        {post.summary}
                                      </p>
                                    </button>
                                  ))
                                ) : (
                                  <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No exact articles found for "{searchTerm}".
                                  </p>
                                )
                              ) : (
                                <div className="py-12 text-center">
                                  <span className="mb-4 block text-4xl opacity-50">🧭</span>
                                  <p className="text-gray-500 dark:text-gray-400">
                                    Search for a concept to read it inline without losing your place
                                    in the current article.
                                  </p>
                                </div>
                              )}
                            </div>

                            {isLoading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
                                <div className="text-primary-500 animate-pulse font-bold">
                                  Loading Article...
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* VIEW: Read Article */}
                        {activeArticle && (
                          <div className="space-y-6">
                            <button
                              onClick={() => setActiveArticle(null)}
                              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center text-sm font-semibold"
                            >
                              &larr; Back to Search
                            </button>

                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                              {activeArticle.title}
                            </h2>

                            <div
                              className="prose dark:prose-invert prose-sm sm:prose-base max-w-none pb-12"
                              dangerouslySetInnerHTML={{ __html: activeArticle.html }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
