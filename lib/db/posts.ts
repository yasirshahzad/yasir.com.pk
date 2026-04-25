/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from './index'
import { posts, postRevisions } from '../../drizzle/schema'
import { eq, desc, and, sql, lte, or } from 'drizzle-orm'
import { calculateReadingTime } from '../../utils/reading-time'

let postsPromise: Promise<any[]> | null = null
let metadataPromise: Promise<any[]> | null = null

export async function getAllPosts(includeDrafts = true) {
  if (postsPromise && includeDrafts) return postsPromise

  const queryPromise = (async () => {
    const query = db.select().from(posts)

    if (!includeDrafts) {
      const now = new Date()
      // @ts-ignore
      query.where(
        and(
          eq(posts.status as any, 'published'),
          or(
            sql`${posts.publishedAt} <= ${now.toISOString()}` as any,
            sql`${posts.publishedAt} IS NULL` as any
          )
        ) as any
      )
    }

    // @ts-ignore
    return query.orderBy(desc(posts.date as any) as any)
  })()

  if (includeDrafts) {
    postsPromise = queryPromise
  }

  return queryPromise
}

export async function getPostsMetadata(includeDrafts = true) {
  if (metadataPromise && includeDrafts) return metadataPromise

  const queryPromise = (async () => {
    const query = db.select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      date: posts.date,
      tags: posts.tags,
      categories: posts.categories,
      draft: posts.draft,
      status: posts.status,
      authors: posts.authors,
      layout: posts.layout,
      images: posts.images,
      summary: posts.summary,
      metaTitle: posts.metaTitle,
      metaDescription: posts.metaDescription,
      canonicalUrl: posts.canonicalUrl,
      ogImage: posts.ogImage,
      readingTime: posts.readingTime,
      viewCount: posts.viewCount,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    }).from(posts)

    if (!includeDrafts) {
      const now = new Date()
      // @ts-ignore
      query.where(
        and(
          eq(posts.status as any, 'published'),
          or(
            sql`${posts.publishedAt} <= ${now.toISOString()}` as any,
            sql`${posts.publishedAt} IS NULL` as any
          )
        ) as any
      )
    }

    // @ts-ignore
    return query.orderBy(desc(posts.date as any) as any)
  })()

  if (includeDrafts) {
    metadataPromise = queryPromise
  }

  return queryPromise
}

export async function getPublishedPosts() {
  const now = new Date()
  // @ts-ignore
  return db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.status as any, 'published'),
        or(lte(posts.publishedAt as any, now), sql`${posts.publishedAt} IS NULL` as any)
      ) as any
    )
    .orderBy(desc(posts.date as any) as any)
}

export async function getPostBySlug(slug: string) {
  // @ts-ignore
  const post = await db
    .select()
    .from(posts)
    .where(eq(posts.slug as any, slug) as any)
    .limit(1)
  return post[0] || null
}

export async function incrementViewCount(slug: string) {
  return (
    db
      .update(posts)
      .set({
        // @ts-ignore
        viewCount: sql`${posts.viewCount} + 1`,
      })
      // @ts-ignore
      .where(eq(posts.slug as any, slug) as any)
  )
}

export async function getPostsByTag(tag: string, includeDrafts = false) {
  const allPosts = await getAllPosts(includeDrafts)
  return allPosts.filter((post) => post.tags?.includes(tag))
}

export async function getTagCounts(includeDrafts = false) {
  const allPosts = await getPostsMetadata(includeDrafts)
  const tagCounts: Record<string, number> = {}
  allPosts.forEach((post) => {
    post.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  return tagCounts
}

export function mapPost(post: Record<string, any>): any {
  return {
    ...post,
    path: `blog/${post.slug}`,
    filePath: `${post.slug}.mdx`,
    body: { raw: post.content },
  }
}

// --- Admin Operations ---

export async function createPost(data: {
  title: string
  slug: string
  content: string
  date?: string
  summary?: string
  tags?: string[]
  categories?: string[]
  status?: 'draft' | 'published' | 'archived' | 'scheduled'
  publishedAt?: Date
  layout?: string
  authors?: string[]
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  ogImage?: string
}) {
  const readingTime = calculateReadingTime(data.content)

  return db
    .insert(posts)
    .values({
      ...data,
      readingTime,
      createdAt: new globalThis.Date(),
      updatedAt: new globalThis.Date(),
    })

    .returning()
}

export async function updatePost(slug: string, data: Record<string, any>) {
  // Create revision before update
  const currentPost = await getPostBySlug(slug)
  if (currentPost) {
    await db.insert(postRevisions).values({
      postId: currentPost.id,
      title: currentPost.title,
      content: currentPost.content,
      summary: currentPost.summary,
      tags: currentPost.tags,
      createdAt: new Date(),
    })
  }

  const updateData = {
    ...data,
    updatedAt: new Date(),
  }

  if (data.content) {
    // @ts-ignore
    updateData.readingTime = calculateReadingTime(data.content)
  }

  return (
    db
      .update(posts)
      .set(updateData)
      // @ts-ignore
      .where(eq(posts.slug as any, slug) as any)
      .returning()
  )
}

export async function getPostRevisions(postId: number) {
  return (
    db
      .select()
      .from(postRevisions)
      // @ts-ignore
      .where(eq(postRevisions.postId as any, postId) as any)
      // @ts-ignore
      .orderBy(desc(postRevisions.createdAt as any))
  )
}

export async function deletePost(slug: string) {
  return (
    db
      .delete(posts)
      // @ts-ignore
      .where(eq(posts.slug as any, slug) as any)
      .returning()
  )
}
