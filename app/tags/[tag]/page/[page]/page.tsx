import { slug } from 'github-slugger'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { notFound } from 'next/navigation'
import { getTagCounts, getAllPosts, mapPost } from '@/lib/db/posts'

const POSTS_PER_PAGE = 5

export const generateStaticParams = async () => {
  const tagCounts = await getTagCounts()
  return Object.keys(tagCounts).flatMap((tag) => {
    const postCount = tagCounts[tag]
    const totalPages = Math.max(1, Math.ceil(postCount / POSTS_PER_PAGE))
    return Array.from({ length: totalPages }, (_, i) => ({
      tag: encodeURI(slug(tag)),
      page: (i + 1).toString(),
    }))
  })
}

export default async function TagPage(props: { params: Promise<{ tag: string; page: string }> }) {
  const params = await props.params
  const tag = decodeURI(params.tag)
  const title = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)
  const pageNumber = parseInt(params.page)

  // Replace Contentlayer core fetching with our DB integration
  const allDbPosts = await getAllPosts()
  const mappedPosts = allDbPosts.map(mapPost)
  const filteredPosts = mappedPosts.filter(
    (post) => post.tags && post.tags.map((t) => slug(t)).includes(tag)
  )

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)

  // Return 404 for invalid page numbers or empty pages
  if (pageNumber <= 0 || pageNumber > totalPages || isNaN(pageNumber)) {
    return notFound()
  }
  const initialDisplayPosts = filteredPosts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
  }

  const tagCounts = await getTagCounts()

  return (
    <ListLayout
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      posts={filteredPosts as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialDisplayPosts={initialDisplayPosts as any}
      pagination={pagination}
      title={title}
      tagCounts={tagCounts}
    />
  )
}
