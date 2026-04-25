/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createPost, updatePost, deletePost } from '@/lib/db/posts'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { assertAdmin } from '@/lib/auth'

export async function savePostAction(formData: FormData) {
  await assertAdmin()
  const slug = formData.get('slug') as string
  const isEditing = formData.get('isEditing') === 'true'
  const originalSlug = formData.get('originalSlug') as string

  const publishedAtRaw = formData.get('publishedAt') as string
  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : undefined

  const postData = {
    title: formData.get('title') as string,
    slug: slug,
    date: formData.get('date') as string,
    tags: (formData.get('tags') as string)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    categories: ((formData.get('categories') as string) || '')
      .split(',')
      .map((cat) => cat.trim())
      .filter(Boolean),
    summary: formData.get('summary') as string,
    content: formData.get('content') as string,
    draft: formData.get('draft') === 'on',
    status: (formData.get('status') as 'draft' | 'published' | 'archived' | 'scheduled') || 'draft',
    publishedAt: publishedAt,
    layout: (formData.get('layout') as string) || 'PostLayout',
    authors: ((formData.get('authors') as string) || 'default')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean),

    // SEO & Social
    metaTitle: formData.get('metaTitle') as string,
    metaDescription: formData.get('metaDescription') as string,
    canonicalUrl: formData.get('canonicalUrl') as string,
    ogImage: formData.get('ogImage') as string,
  }

  if (isEditing && originalSlug) {
    await updatePost(originalSlug, postData)
  } else {
    await createPost(postData)
  }

  revalidatePath('/admin')
  revalidatePath('/blog')
  revalidatePath(`/blog/${slug}`)

  redirect('/admin')
}

export async function deletePostAction(slug: string) {
  await assertAdmin()
  await deletePost(slug)
  revalidatePath('/admin')
  revalidatePath('/blog')
  redirect('/admin')
}

export async function getRevisionsAction(postId: number) {
  await assertAdmin()
  const { getPostRevisions } = await import('@/lib/db/posts')
  return await getPostRevisions(postId)
}

export async function restoreRevisionAction(revisionId: number) {
  await assertAdmin()
  const { db } = await import('@/lib/db/index')
  const { postRevisions, posts } = await import('../../drizzle/schema')
  const { eq } = await import('drizzle-orm')
  // @ts-ignore
  const revision = await db
    .select()
    .from(postRevisions)
    .where(eq(postRevisions.id as any, revisionId) as any)
    .limit(1)
  if (!revision[0]) throw new Error('Revision not found')

  if (!revision[0].postId) throw new Error('Post ID missing in revision')

  await db
    .update(posts)
    .set({
      title: revision[0].title,
      content: revision[0].content,
      summary: revision[0].summary,
      tags: revision[0].tags,
      updatedAt: new Date(),
    })
    // @ts-ignore
    .where(eq(posts.id as any, revision[0].postId) as any)

  revalidatePath('/admin')
  return { success: true }
}

export async function autoSavePostAction(slug: string, data: Record<string, any>) {
  try {
    await assertAdmin()
    const { updatePost } = await import('@/lib/db/posts')
    await updatePost(slug, data)
    return { success: true, timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('Auto-save failed:', error)
    return { success: false }
  }
}
