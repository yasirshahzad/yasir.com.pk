'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { bulkUpdatePosts, bulkDeletePosts } from '@/app/actions/blogActions'

interface Post {
  id: number
  title: string
  slug: string
  status: string
  date: string
  viewCount: number
}

export default function PostsManager({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredPosts = useMemo(() => {
    return posts.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
    )
  }, [posts, search])

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPosts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredPosts.map(p => p.id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to set ${selectedIds.length} posts to ${status}?`)) return

    setIsProcessing(true)
    const result = await bulkUpdatePosts(selectedIds, { status })
    if (result.success) {
      setPosts(prev => prev.map(p => 
        selectedIds.includes(p.id) ? { ...p, status } : p
      ))
      setSelectedIds([])
    } else {
      alert(result.error)
    }
    setIsProcessing(false)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`CRITICAL: Are you sure you want to PERMANENTLY DELETE ${selectedIds.length} posts? This cannot be undone.`)) return

    setIsProcessing(true)
    const result = await bulkDeletePosts(selectedIds)
    if (result.success) {
      setPosts(prev => prev.filter(p => !selectedIds.includes(p.id)))
      setSelectedIds([])
    } else {
      alert(result.error)
    }
    setIsProcessing(false)
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search posts by title or slug..."
            className="w-full rounded-xl border-gray-100 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-800 dark:bg-gray-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <span className="text-xs font-bold text-gray-500 mr-2">{selectedIds.length} selected</span>
              <button
                onClick={() => handleBulkUpdate('published')}
                disabled={isProcessing}
                className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100 disabled:opacity-50 dark:bg-green-900/20 dark:text-green-400"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkUpdate('draft')}
                disabled={isProcessing}
                className="rounded-lg bg-yellow-50 px-3 py-1.5 text-xs font-bold text-yellow-700 hover:bg-yellow-100 disabled:opacity-50 dark:bg-yellow-900/20 dark:text-yellow-400"
              >
                Draft
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden dark:border-gray-800 dark:bg-gray-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-800">
                <th className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={selectedIds.length === filteredPosts.length && filteredPosts.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-4">Title</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4 text-right pr-8">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredPosts.map((post) => (
                <tr key={post.id} className={`group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${selectedIds.includes(post.id) ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={selectedIds.includes(post.id)}
                      onChange={() => toggleSelect(post.id)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/edit/${post.slug}`} className="font-bold text-gray-900 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {post.title}
                    </Link>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{post.slug}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                      post.status === 'published' 
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(post.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right pr-8 font-mono text-xs text-gray-500">
                    {post.viewCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPosts.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">No posts found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
