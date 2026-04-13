'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [readingProgress, setReadingProgress] = useState(0)

  const scrollListener = () => {
    if (!window) return

    const totalHeight = document.documentElement.scrollHeight - window.innerHeight
    const windowScrollTop = window.scrollY || document.documentElement.scrollTop

    if (windowScrollTop === 0) {
      return setReadingProgress(0)
    }

    if (windowScrollTop > totalHeight) {
      return setReadingProgress(100)
    }

    setReadingProgress((windowScrollTop / totalHeight) * 100)
  }

  useEffect(() => {
    window.addEventListener('scroll', scrollListener)
    return () => window.removeEventListener('scroll', scrollListener)
  }, [])

  return (
    <div className="fixed top-0 left-0 z-50 h-1.5 w-full bg-gray-200 dark:bg-gray-800">
      <div
        className="bg-primary-500 dark:bg-primary-400 h-1.5 shadow-[0_0_10px_rgba(var(--color-primary-500),0.8)] transition-all duration-150 ease-out"
        style={{ width: `${readingProgress}%` }}
      />
    </div>
  )
}
