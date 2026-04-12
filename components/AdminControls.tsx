'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminControls({ slug }: { slug: string }) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check if the secure middleware previously authorized this user
    if (document.cookie.includes('adminSession=1')) {
      setIsAdmin(true)
    }
  }, [])

  if (!isAdmin) return null

  return (
    <div className="mt-4 flex items-center justify-center rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 dark:border-primary-900 dark:bg-primary-900/10">
      <Link 
        href={`/admin/edit/${slug}`}
        className="flex items-center text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        ✏️ Edit this Article in Admin Panel
      </Link>
    </div>
  )
}
