'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'

export default function ZenModeControls() {
  const [isOpen, setIsOpen] = useState(false)
  const [fontSizeScale, setFontSizeScale] = useState(100)
  const [isZenMode, setIsZenMode] = useState(false)

  // Load preferences
  useEffect(() => {
    const savedFont = localStorage.getItem('blog-font-scale')
    if (savedFont) {
      applyFontScale(parseInt(savedFont))
    }

    const savedZen = localStorage.getItem('blog-zen-mode')
    if (savedZen === 'true') {
      toggleZenMode(true)
    }
  }, [])

  const applyFontScale = (scale: number) => {
    // Limits: 80% to 150%
    if (scale < 80 || scale > 150) return
    setFontSizeScale(scale)
    localStorage.setItem('blog-font-scale', scale.toString())
    // Modifying the root html element instantly scales all Tailwind 'rem' typography perfectly!
    document.documentElement.style.fontSize = `${(scale / 100) * 16}px`
  }

  const toggleZenMode = (enabled: boolean) => {
    setIsZenMode(enabled)
    localStorage.setItem('blog-zen-mode', enabled ? 'true' : 'false')
    
    // Zen mode hides standard site navigations to focus entirely on the reading content
    if (enabled) {
      document.body.classList.add('zen-mode-active')
      // Custom CSS to hide the header and footer will be managed globally
    } else {
      document.body.classList.remove('zen-mode-active')
    }
  }

  return (
    <>
      {/* Floating Trigger Button inside the stack */}
      <button
        aria-label="Reader Preferences"
        title="Reader Preferences (Zen Mode, Font Size)"
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-gray-200 p-2 text-gray-500 transition-all hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 shadow-lg hover:rotate-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 00-.707.293l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7A1 1 0 0010 2zm3 9a1 1 0 00-1-1H8a1 1 0 00-1 1v1h6v-1z" clipRule="evenodd" />
        </svg>
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3"
                  >
                    Reader Preferences
                  </Dialog.Title>
                  
                  <div className="mt-6 flex flex-col gap-6">
                    {/* Font Scaling */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                        Typography Scale
                      </p>
                      <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                        <button
                          onClick={() => applyFontScale(fontSizeScale - 10)}
                          className="flex-1 rounded-lg bg-gray-200 dark:bg-gray-700 py-2 text-gray-900 dark:text-gray-100 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                          A-
                        </button>
                        <span className="w-16 text-center font-mono text-primary-500 font-bold">
                          {fontSizeScale}%
                        </span>
                        <button
                          onClick={() => applyFontScale(fontSizeScale + 10)}
                          className="flex-1 rounded-lg bg-gray-200 dark:bg-gray-700 py-2 text-gray-900 dark:text-gray-100 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                          A+
                        </button>
                      </div>
                    </div>

                    {/* Zen Mode Toggle */}
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Zen Mode</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dim all distractions globally</p>
                      </div>
                      <button
                        onClick={() => toggleZenMode(!isZenMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                          isZenMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isZenMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-xl border border-transparent bg-primary-100 px-4 py-3 text-sm font-semibold text-primary-900 hover:bg-primary-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
                      onClick={() => setIsOpen(false)}
                    >
                      Done Editing
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
