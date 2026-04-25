'use server'

import { db } from 'lib/db'
import { readerNotes } from 'drizzle/schema'
import { createClient } from '@/utils/supabase/server'
import { eq, desc } from 'drizzle-orm'

export async function saveNote(
  quote: string,
  url: string,
  highlightText?: string,
  postTitle?: string
) {
  if (!quote || quote.length < 3) return { success: false, reason: 'Invalid quote' }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, reason: 'Not authenticated' }
    }

    await db.insert(readerNotes).values({
      userId: user.id,
      quote: quote,
      sourceUrl: url,
      // @ts-ignore – new columns added via migration
      highlightText: highlightText ?? quote,
      // @ts-ignore
      postTitle: postTitle ?? null,
    })

    return { success: true }
  } catch (error) {
    console.error('Note save error', error)
    return { success: false, reason: 'Server error saving note' }
  }
}

export async function getReaderNotes() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const notes = await db
      .select()
      .from(readerNotes)
      // @ts-ignore
      .where(eq(readerNotes.userId, user.id))
      // @ts-ignore
      .orderBy(desc(readerNotes.createdAt))

    return notes
  } catch (error) {
    console.error('Failed to fetch notes', error)
    return null
  }
}

export async function deleteNote(noteId: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, reason: 'Not authenticated' }

    const { and } = await import('drizzle-orm')
    // Only allow deleting your own notes
    await db
      .delete(readerNotes)
      // @ts-ignore
      .where(and(eq(readerNotes.id, noteId), eq(readerNotes.userId, user.id)))

    return { success: true }
  } catch (error) {
    console.error('Failed to delete note', error)
    return { success: false, reason: 'Server error' }
  }
}
