import { getPostsMetadata } from '@/lib/db/posts'
import PostsManager from '@/components/PostsManager'

export default async function AdminPostsPage() {
  const posts = await getPostsMetadata() || []
  
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Manage Posts</h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bulk edit, search, and organize your content.</p>
      </div>

      <PostsManager initialPosts={posts as any} />
    </div>
  )
}
