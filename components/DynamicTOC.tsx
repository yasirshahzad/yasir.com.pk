'use client'

import { useEffect, useState } from 'react'

type TOCItem = {
  id: string
  text: string
  level: number
}

export default function DynamicTOC() {
  const [headings, setHeadings] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('.prose h2, .prose h3'))
    const items: TOCItem[] = elements
      .map((elem) => ({
        id: elem.id,
        text: elem.textContent || '',
        level: Number(elem.tagName.substring(1)),
      }))
      .filter((item) => item.id)

    setHeadings(items)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '0px 0px -80% 0px' }
    )

    elements.forEach((elem) => observer.observe(elem))
    return () => observer.disconnect()
  }, [])

  if (headings.length === 0) return null

  const activeHeading = headings.find((h) => h.id === activeId)

  return (
    <nav aria-label="Table of contents" className="select-none">
      {/* Toggle row — always visible, takes ~1 line */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center justify-between gap-2 rounded-lg py-1 text-left transition-colors"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500">
          <svg
            className="h-3 w-3 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
          </svg>
          Contents
        </span>

        <span className="flex min-w-0 items-center gap-1.5">
          {/* Show active section name when collapsed */}
          {!open && activeHeading && (
            <span className="text-primary-500 dark:text-primary-400 max-w-[120px] truncate text-[10px] font-medium">
              {activeHeading.text}
            </span>
          )}
          <svg
            className={`h-3 w-3 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Expandable list */}
      {open && (
        <ul className="mt-2" style={{ margin: 0, padding: 0 }}>
          {headings.map((heading) => {
            const isActive = activeId === heading.id
            const isH3 = heading.level === 3

            return (
              <li key={heading.id} style={{ margin: 0, padding: 0 }}>
                <a
                  href={`#${heading.id}`}
                  title={heading.text}
                  style={{ textDecoration: 'none' }}
                  onClick={(e) => {
                    e.preventDefault()
                    const target = document.getElementById(heading.id)
                    if (target) {
                      const y = target.getBoundingClientRect().top + window.scrollY - 100
                      window.scrollTo({ top: y, behavior: 'smooth' })
                    }
                    setOpen(false)
                  }}
                  className={[
                    'group flex items-center gap-1.5 rounded py-[1px] text-[11px] leading-snug transition-all duration-150',
                    isH3 ? 'pl-4' : 'pl-0',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'inline-block h-1 shrink-0 rounded-full transition-all duration-200',
                      isActive
                        ? 'bg-primary-500 w-3'
                        : 'w-1 bg-gray-300 group-hover:w-2 dark:bg-gray-700',
                      isH3 ? 'opacity-60' : '',
                    ].join(' ')}
                  />
                  <span className="truncate">{heading.text}</span>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
