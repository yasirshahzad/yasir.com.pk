import { slug } from 'github-slugger'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { getAllPosts, mapPost, getTagCounts, getPostsMetadata } from '@/lib/db/posts'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'

const POSTS_PER_PAGE = 5

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tag = decodeURI(params.tag)

  return genPageMetadata({
    title: tag,
    description: `${siteMetadata.title} ${tag} tagged content`,
    alternates: {
      canonical: './',
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/tags/${tag}/feed.xml`,
      },
    },
  })
}

export const generateStaticParams = async () => {
  const allPosts = await getPostsMetadata()
  const tags = new Set<string>()
  allPosts.forEach((post) => {
    post.tags?.forEach((tag) => tags.add(slug(tag)))
  })
  return Array.from(tags).map((tag) => ({
    tag: encodeURI(tag),
  }))
}

export default async function TagPage(props: { params: Promise<{ tag: string }> }) {
  const params = await props.params
  const tag = decodeURI(params.tag)
  const title = tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)

  const allDbPosts = await getPostsMetadata()
  const tagCounts = await getTagCounts()
  const filteredPosts = allDbPosts
    .filter((post) => post.tags && post.tags.map((t) => slug(t)).includes(tag))
    .map(mapPost)

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages: totalPages,
  }

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
