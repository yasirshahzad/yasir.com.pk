import ListLayout from '@/layouts/ListLayoutWithTags'
import { getAllPosts, mapPost, getTagCounts } from '@/lib/db/posts'
import { notFound } from 'next/navigation'

const POSTS_PER_PAGE = 5

export const generateStaticParams = async () => {
  const allPosts = await getAllPosts()
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
  const paths = Array.from({ length: totalPages }, (_, i) => ({ page: (i + 1).toString() }))

  return paths
}

export default async function Page(props: { params: Promise<{ page: string }> }) {
  const params = await props.params
  const allDbPosts = await getAllPosts()
  const tagCounts = await getTagCounts()
  const posts = allDbPosts.map(mapPost)

  const pageNumber = parseInt(params.page as string)
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)

  if (pageNumber <= 0 || pageNumber > totalPages || isNaN(pageNumber)) {
    return notFound()
  }
  const initialDisplayPosts = posts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
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
