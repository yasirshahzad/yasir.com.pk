'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from 'utils/supabase/client'

export default function AdminControls({ slug }: { slug: string }) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setIsAdmin(true)
    }
    checkAuth()
  }, [])

  if (!isAdmin) return null

  return (
    <div className="border-primary-100 bg-primary-50 dark:border-primary-900 dark:bg-primary-900/10 mt-4 flex items-center justify-center rounded-lg border px-4 py-3">
      <Link
        href={`/admin/edit/${slug}`}
        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center text-sm font-bold"
      >
        ✏️ Edit this Article in Admin Panel
      </Link>
    </div>
  )
}
