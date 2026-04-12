import { getAllPosts } from 'lib/db/posts'
import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'
import PageTitle from '@/components/PageTitle'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'

export default async function AdminDashboard() {
  const posts = await getAllPosts()

  return (
    <SectionContainer>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <div className="flex items-center justify-between">
            <PageTitle>Admin Dashboard</PageTitle>
            <Link
              href="/admin/new"
              className="rounded-md bg-primary-500 px-4 py-2 font-medium text-white hover:bg-primary-600 dark:hover:bg-primary-400"
            >
              New Post
            </Link>
          </div>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            Manage your blog posts ({posts.length} total)
          </p>
        </div>
        <div className="py-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {posts.map((post) => (
                  <li key={post.slug} className="hidden" /> // For key consistency if using map in actual table
                ))}
                {posts.map((post) => (
                  <tr key={post.slug} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {post.date ? formatDate(post.date, siteMetadata.locale) : 'No Date'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {post.title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {post.draft ? (
                        <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                          Draft
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-100">
                          Published
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/admin/edit/${post.slug}`}
                        className="mr-4 text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
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
      </div>
    </SectionContainer>
  )
}
