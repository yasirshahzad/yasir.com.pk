import { getAllPosts, mapPost, getTagCounts } from '@/lib/db/posts'
import { genPageMetadata } from 'app/seo'
import ListLayout from '@/layouts/ListLayoutWithTags'

const POSTS_PER_PAGE = 5

export const metadata = genPageMetadata({ title: 'Blog' })

export default async function BlogPage(props: { searchParams: Promise<{ page: string }> }) {
  const allDbPosts = await getAllPosts(false) // Only show published posts
  const tagCounts = await getTagCounts()
  const posts = allDbPosts.map(mapPost)

  const pageNumber = 1
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = posts.slice(0, POSTS_PER_PAGE * pageNumber)
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
  }

  return (
    <ListLayout
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      posts={posts as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialDisplayPosts={initialDisplayPosts as any}
      pagination={pagination}
      title="All Posts"
      tagCounts={tagCounts}
    />
  )
}
