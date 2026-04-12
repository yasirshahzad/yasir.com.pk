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

  useEffect(() => {
    // 1. Scan the article for headers
    const elements = Array.from(document.querySelectorAll('.prose h2, .prose h3'))
    const items: TOCItem[] = elements.map((elem) => ({
      id: elem.id,
      text: elem.textContent || '',
      level: Number(elem.tagName.substring(1)), // 2 or 3
    })).filter(item => item.id) // Only keep items with IDs (injected by rehype-slug)

    setHeadings(items)

    // 2. Setup Intersection Observer for Dynamic Highlighting
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0px 0px -80% 0px' } // Trigger when the heading is near the top
    )

    elements.forEach((elem) => observer.observe(elem))

    return () => observer.disconnect()
  }, [])

  if (headings.length === 0) return null

  return (
    <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar rounded-xl bg-gray-50/50 p-4 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 hidden xl:block z-10 transition-all">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        On this page
      </h3>
      <ul className="space-y-2.5 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={`transition-colors duration-200 ${
              heading.level === 3 ? 'ml-4 text-xs' : 'font-medium'
            } ${
              activeId === heading.id
                ? 'text-primary-600 dark:text-primary-400 font-bold border-l-2 border-primary-500 pl-2 -ml-[10px]'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault()
                const target = document.getElementById(heading.id)
                if (target) {
                  // Smooth scroll accounting for sticky headers
                  const y = target.getBoundingClientRect().top + window.scrollY - 100
                  window.scrollTo({ top: y, behavior: 'smooth' })
                }
              }}
              className="block truncate"
              title={heading.text}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
