'use server'

import { db } from '@/lib/db'
import { comments, readerProfiles } from '@/drizzle/schema'
import { eq, and, asc, desc } from 'drizzle-orm'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

import { isAdmin } from '@/lib/auth'

export async function getComments(postId: number) {
  try {
    const allComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        userId: comments.userId,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        user: {
          fullName: readerProfiles.fullName,
          avatarUrl: readerProfiles.avatarUrl,
        }
      })
      .from(comments)
      .leftJoin(readerProfiles, eq(comments.userId, readerProfiles.id))
      // @ts-ignore
      .where(and(eq(comments.postId, postId), eq(comments.isApproved, true)))
      .orderBy(asc(comments.createdAt))

    return { success: true, data: allComments }
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return { success: false, error: 'Failed to fetch comments' }
  }
}

export async function addComment(postId: number, content: string, parentId?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!content || content.trim().length < 2) {
    return { success: false, error: 'Comment is too short' }
  }

  // Optional: Force authentication for comments if desired
  // if (!user) return { success: false, error: 'Please sign in to comment' }

  try {
    await db.insert(comments).values({
      postId,
      userId: user?.id || null, 
      content: content.trim(),
      parentId: parentId || null,
      isApproved: true,
    })

    revalidatePath(`/blog`)
    return { success: true }
  } catch (error) {
    console.error('Failed to add comment:', error)
    return { success: false, error: 'Database error' }
  }
}

export async function deleteComment(commentId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const isUserAdmin = await isAdmin()

    if (isUserAdmin) {
      // @ts-ignore
      await db.delete(comments).where(eq(comments.id, commentId))
    } else {
      // @ts-ignore
      await db.delete(comments).where(
        and(eq(comments.id, commentId), eq(comments.userId, user.id))
      )
    }

    revalidatePath(`/blog`)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return { success: false, error: 'Delete failed' }
  }
}
