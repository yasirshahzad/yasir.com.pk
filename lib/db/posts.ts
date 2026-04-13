import { db } from './index'
import { posts } from '../../drizzle/schema'
import { eq, desc, and, sql } from 'drizzle-orm'

let postsPromise: Promise<any[]> | null = null

export async function getAllPosts() {
  if (postsPromise) return postsPromise
  
  postsPromise = (async () => {
    try {
      // @ts-ignore
      const allPosts = await db.select().from(posts).orderBy(desc(posts.date))
      return allPosts
    } catch (err) {
      postsPromise = null // Reset cache on failure to allow retry
      throw err
    }
  })()
  
  return postsPromise
}

export async function getPostBySlug(slug: string) {
  // @ts-ignore
  const post = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1)
  return post[0] || null
}

export async function getPostsByTag(tag: string) {
  // Tags are stored as jsonb array. Using sql operator for filtering.
  const allPosts = await getAllPosts()
  return allPosts.filter((post) => post.tags?.includes(tag))
}

export async function getTagCounts() {
  const allPosts = await getAllPosts()
  const tagCounts: Record<string, number> = {}
  allPosts.forEach((post) => {
    post.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  return tagCounts
}

// Map the DB post to a format similar to Contentlayer for easier transition
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  tags?: string[]
}) {
  return db
    .insert(posts)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePost(slug: string, data: Record<string, any>) {
  return (
    db
      .update(posts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      // @ts-ignore
      .where(eq(posts.slug, slug))
      .returning()
  )
}

export async function deletePost(slug: string) {
  return (
    db
      .delete(posts)
      // @ts-ignore
      .where(eq(posts.slug, slug))
      .returning()
  )
}
