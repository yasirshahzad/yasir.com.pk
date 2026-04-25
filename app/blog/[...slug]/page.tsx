/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPostBySlug, getAllPosts, mapPost, incrementViewCount } from '@/lib/db/posts'
import { getAuthorBySlug } from '@/lib/db/authors'
import PostSimple from '@/layouts/PostSimple'
import PostLayout from '@/layouts/PostLayout'
import PostBanner from '@/layouts/PostBanner'
import { notFound } from 'next/navigation'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { extractTocHeadings } from 'pliny/mdx-plugins/index.js'
import Link from '@/components/Link'
import siteMetadata from '@/data/siteMetadata'
import { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import InlinePostEditor from '@/components/InlinePostEditor'

const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
}
const defaultLayout = 'PostLayout'

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  try {
    const params = await props.params
    const slug = decodeURI(params.slug.join('/'))
    const post = await getPostBySlug(slug)
    if (!post) return
    const authorList = (post.authors as string[]) || ['default']
    const authorDetails = authorList.map((author) => getAuthorBySlug(author)).filter(Boolean)
    const dateStr = post.publishedAt || post.date || new Date().toISOString()
    const publishedAt = new Date(dateStr).toISOString()
    const modifiedAt = post.updatedAt ? post.updatedAt.toISOString() : publishedAt

    const authors = authorDetails.map((author: any) => author.name)
    let imageList = [siteMetadata.socialBanner]
    if (post.ogImage) {
      imageList = [post.ogImage]
    } else if (post.images) {
      imageList = Array.isArray(post.images) ? post.images : [post.images as string]
    }
    const ogImages = imageList.map((img) => ({
      url: img && img.includes('http') ? img : siteMetadata.siteUrl + img,
    }))

    return {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary || undefined,
      alternates: {
        canonical: post.canonicalUrl || undefined,
      },
      openGraph: {
        title: post.metaTitle || post.title,
        description: post.metaDescription || post.summary || undefined,
        siteName: siteMetadata.title,
        locale: siteMetadata.locale,
        type: 'article',
        publishedTime: publishedAt,
        modifiedTime: modifiedAt,
        url: './',
        images: ogImages,
        authors: authors.length > 0 ? authors : [siteMetadata.author],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.metaTitle || post.title,
        description: post.metaDescription || post.summary || undefined,
        images: imageList,
      },
    }
  } catch (error) {
    return {}
  }
}

export const generateStaticParams = async () => {
  const allPosts = await getAllPosts(false) // Only static gen for published posts
  return allPosts.map((p) => ({
    slug: p.slug.split('/').filter(Boolean),
  }))
}

function TableOfContents({ toc }: { toc: any[] }) {
  if (!toc || toc.length === 0) return null
  return (
    <div className="mb-12 border-l border-gray-100 py-1 pl-6 dark:border-gray-800">
      <h2 className="mb-6 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
        Table of Contents
      </h2>
      <ul className="space-y-2">
        {toc.map((item, index) => (
          <li
            key={item.url}
            style={{ paddingLeft: `${Math.max(0, item.depth - 2) * 1.5}rem` }}
            className={`transition-all duration-200 ${
              item.depth <= 2 && index !== 0 ? 'pt-4' : ''
            }`}
          >
            <Link
              href={item.url}
              className={`inline-block py-0.5 transition-colors ${
                item.depth <= 2
                  ? 'hover:text-primary-500 text-sm font-semibold text-gray-900 dark:text-gray-100'
                  : 'hover:text-primary-500 text-[13px] text-gray-500 dark:text-gray-400'
              }`}
            >
              {item.value}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const post = await getPostBySlug(slug)

  if (!post) {
    return notFound()
  }

  // Check for admin session
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAdmin = user && user.email === process.env.ADMIN_EMAIL

  // Status check for non-admins
  if (!isAdmin) {
    const isPublished = post.status === 'published'
    const isScheduled =
      post.status === 'scheduled' && post.publishedAt && new Date(post.publishedAt) > new Date()

    if (!isPublished || isScheduled) {
      return notFound()
    }

    // Increment view count for real users
    await incrementViewCount(slug)
  }

  const authorList = (post.authors as string[]) || ['default']
  const authorDetails = authorList.map((author) => getAuthorBySlug(author)).filter(Boolean) as any

  let toc: any = []
  try {
    const allToc = await extractTocHeadings(post.content || '')
    toc = allToc.filter((item: any) => item.depth <= 3)
  } catch (e) {
    console.error('TOC Extraction Error:', e)
  }

  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(post.content || '')

  const contentHtml = processedContent.toString()

  const mainContent = {
    ...mapPost(post),
    readingTime: post.readingTime || 1,
    toc,
  }

  const Layout = layouts[post.layout as keyof typeof layouts] || layouts[defaultLayout]

  return (
    <Layout content={mainContent as any} authorDetails={authorDetails}>
      <div className="prose dark:prose-invert max-w-none pt-10 pb-8">
        <TableOfContents toc={toc} />
        <InlinePostEditor
          slug={post.slug}
          initialHtml={contentHtml}
          isAdmin={!!isAdmin}
          metadata={{
            title: post.title || '',
            summary: post.summary || '',
            images: (post.images as string[]) || [],
          }}
        />
      </div>
    </Layout>
  )
}
