'use server'

import { db } from 'lib/db'
import { readerNotes } from 'drizzle/schema'
import { createClient } from '@/utils/supabase/server'
import { eq, desc } from 'drizzle-orm'

export async function saveNote(quote: string, url: string) {
  if (!quote || quote.length < 3) return { success: false, reason: 'Invalid quote' }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, reason: 'Not authenticated' }
    }

    await db.insert(readerNotes).values({
      userId: user.id,
      quote: quote,
      sourceUrl: url,
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const notes = await db.select()
      .from(readerNotes)
      .where(eq(readerNotes.userId, user.id))
      .orderBy(desc(readerNotes.createdAt))

    return notes
  } catch (error) {
    console.error('Failed to fetch notes', error)
    return null
  }
}
