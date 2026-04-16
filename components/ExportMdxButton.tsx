'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { fetchPostForExport } from '@/app/actions/blogActions'

export default function ExportMdxButton() {
  const [isExporting, setIsExporting] = useState(false)
  const pathname = usePathname()

  // Only show on blog post pages (not /blog listing or /blog/page/X)
  const isBlogPost = pathname.startsWith('/blog/') && !pathname.startsWith('/blog/page/')
  if (!isBlogPost) return null

  // Extract slug from pathname: /blog/some/nested/slug -> some/nested/slug
  const slug = pathname.replace('/blog/', '')

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await fetchPostForExport(slug)

      if (!result.success) {
        alert(result.error || 'Export failed')
        return
      }

      const blob = new Blob([result.mdx!], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename!
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      aria-label="Export as MDX"
      onClick={handleExport}
      disabled={isExporting}
      title="Export as MDX"
      className="rounded-full bg-gray-200 p-2 text-gray-500 transition-all hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 disabled:opacity-50"
    >
      {isExporting ? (
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
    </button>
  )
}
