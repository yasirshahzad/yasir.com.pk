import { getAllPosts } from '@/lib/db/posts'
import Link from 'next/link'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'

const statusStyles = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
}

export default async function AdminPostsPage() {
  const posts = await getAllPosts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Posts</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your blog posts ({posts.length} total)
          </p>
        </div>
        <Link
          href="/admin/new"
          className="bg-primary-500 hover:bg-primary-600 dark:hover:bg-primary-400 rounded-lg px-4 py-2 font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          + New Post
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Post Details
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Views
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {posts.map((post) => (
              <tr
                key={post.slug}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30"
              >
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {post.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {post.date ? formatDate(post.date, siteMetadata.locale) : 'No Date'} •{' '}
                    {post.readingTime || 0} min read
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${statusStyles[post.status as keyof typeof statusStyles] || statusStyles.draft}`}
                  >
                    {post.status || 'draft'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {post.viewCount || 0}
                </td>
                <td className="space-x-4 px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                  <Link
                    href={`/admin/edit/${post.slug}`}
                    className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-gray-500 transition-colors hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
