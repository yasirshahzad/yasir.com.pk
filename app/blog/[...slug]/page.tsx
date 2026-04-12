import 'css/prism.css'
import 'katex/dist/katex.css'
import { getPostBySlug, getAllPosts, mapPost } from 'lib/db/posts'
import { getAuthorBySlug } from 'lib/db/authors'
import PostSimple from '@/layouts/PostSimple'
import PostLayout from '@/layouts/PostLayout'
import PostBanner from '@/layouts/PostBanner'
import { notFound } from 'next/navigation'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { extractTocHeadings } from 'pliny/mdx-plugins/index.js'
import Link from '@/components/Link'
import siteMetadata from '@/data/siteMetadata'
import { Metadata } from 'next'

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
    const dateStr = post.date || new Date().toISOString()
    const publishedAt = new Date(dateStr).toISOString()
    const modifiedAt = post.updatedAt ? post.updatedAt.toISOString() : publishedAt
    const authors = authorDetails.map((author: any) => author.name)
    let imageList = [siteMetadata.socialBanner]
    if (post.images) {
      imageList = Array.isArray(post.images) ? post.images : [post.images as string]
    }
    const ogImages = imageList.map((img) => ({
      url: img && img.includes('http') ? img : siteMetadata.siteUrl + img,
    }))
    return {
      title: post.title,
      description: post.summary,
      openGraph: {
        title: post.title,
        description: post.summary,
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
        title: post.title,
        description: post.summary,
        images: imageList,
      },
    }
  } catch (error) {
    return {}
  }
}

export const generateStaticParams = async () => {
  const allPosts = await getAllPosts()
  return allPosts.map((p) => ({ slug: p.slug.split('/') }))
}

function TableOfContents({ toc }: { toc: any[] }) {
  if (!toc || toc.length === 0) return null
  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <h2 className="mb-4 text-xl font-bold">Table of Contents</h2>
      <ul className="space-y-2">
        {toc.map((item) => (
          <li 
            key={item.url} 
            style={{ paddingLeft: `${(item.depth - 1) * 1}rem` }}
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <Link href={item.url}>{item.value}</Link>
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

  const authorList = (post.authors as string[]) || ['default']
  const authorDetails = authorList.map((author) => getAuthorBySlug(author)).filter(Boolean) as any

  let toc = []
  try {
    toc = await extractTocHeadings(post.content || '')
  } catch (e) {
    console.error('TOC Extraction Error:', e)
  }

  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(post.content || '')
  
  const contentHtml = processedContent.toString()

  // Calculate reading time
  const words = (post.content || '').trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / 200);

  const mainContent = {
    ...mapPost(post),
    readingTime: readingTime > 0 ? readingTime : 1,
    toc,
  }

  const Layout = layouts[post.layout as keyof typeof layouts] || layouts[defaultLayout]

  return (
    <Layout content={mainContent} authorDetails={authorDetails}>
      <div className="prose dark:prose-invert max-w-none pt-10 pb-8">
        <TableOfContents toc={toc} />
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
    </Layout>
  )
}
