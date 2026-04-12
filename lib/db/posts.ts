import { db } from './index';
import { posts } from '../../drizzle/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function getAllPosts() {
  const allPosts = await db.select().from(posts).orderBy(desc(posts.date));
  return allPosts;
}

export async function getPostBySlug(slug: string) {
  const post = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  return post[0] || null;
}

export async function getPostsByTag(tag: string) {
  // Tags are stored as jsonb array. Using sql operator for filtering.
  const allPosts = await getAllPosts();
  return allPosts.filter(post => post.tags?.includes(tag));
}

export async function getTagCounts() {
  const allPosts = await getAllPosts();
  const tagCounts: Record<string, number> = {};
  allPosts.forEach(post => {
    post.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return tagCounts;
}

// Map the DB post to a format similar to Contentlayer for easier transition
export function mapPost(post: any) {
  return {
    ...post,
    path: `blog/${post.slug}`,
    filePath: `${post.slug}.mdx`,
    body: { raw: post.content },
  }
}
// --- Admin Operations ---

export async function createPost(data: any) {
  return db.insert(posts).values({
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  }).returning();
}

export async function updatePost(slug: string, data: any) {
  return db.update(posts)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(posts.slug, slug))
    .returning();
}

export async function deletePost(slug: string) {
  return db.delete(posts)
    .where(eq(posts.slug, slug))
    .returning();
}
