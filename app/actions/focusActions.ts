'use server'

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { readerProfiles, readingLogs } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/utils/supabase/server'

// Helper to get local date string YYYY-MM-DD
function getTodayDateString() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

// Ensure the Reader profile exists gracefully
async function getOrInstallReaderProfile(userId: string) {
  try {
    // @ts-ignore
    const existing = await db
      .select()
      .from(readerProfiles)
      // @ts-ignore
      .where(eq(readerProfiles.id, userId))
      .limit(1)
    if (existing.length === 0) {
      await db.insert(readerProfiles).values({ id: userId, currentStreak: 0, longestStreak: 0 })
    }
  } catch (e) {
    console.error('Failed to query or seed reader account', e)
  }
  return userId
}

export async function syncFocusTime(seconds: number) {
  if (!seconds || seconds <= 0) return { success: false }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, reason: 'Not authenticated' }
  }

  try {
    const readerId = await getOrInstallReaderProfile(user.id)
    const todayStr = getTodayDateString()

    // 1. Log or update today's focus time
    const existingLogArray = await db
      .select()
      .from(readingLogs)
      // @ts-ignore
      .where(and(eq(readingLogs.readerId, readerId), eq(readingLogs.date, todayStr)))
      .limit(1)

    if (existingLogArray.length > 0) {
      await db
        .update(readingLogs)
        .set({ totalSeconds: (existingLogArray[0].totalSeconds || 0) + seconds })
        // @ts-ignore
        .where(eq(readingLogs.id, existingLogArray[0].id))
    } else {
      await db.insert(readingLogs).values({ readerId, date: todayStr, totalSeconds: seconds })
    }

    // 2. Refresh Streaks safely
    // @ts-ignore
    const profileArray = await db
      .select()
      .from(readerProfiles)
      // @ts-ignore
      .where(eq(readerProfiles.id, readerId))
      .limit(1)
    if (profileArray.length > 0) {
      const profile = profileArray[0]
      const lastActive = profile.lastActiveDate

      if (lastActive !== todayStr) {
        // Did they read yesterday?
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        let newStreak = profile.currentStreak || 0
        if (lastActive === yesterdayStr) {
          newStreak += 1
        } else {
          // Streak broken
          newStreak = 1
        }

        const newLongest = Math.max(newStreak, profile.longestStreak || 0)

        await db
          .update(readerProfiles)
          .set({
            lastActiveDate: todayStr,
            currentStreak: newStreak,
            longestStreak: newLongest,
          })
          // @ts-ignore
          .where(eq(readerProfiles.id, readerId))
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Focus sync error', error)
    return { success: false }
  }
}

export async function getReaderStats() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { isLoggedIn: false }
    }

    const focusId = user.id

    const profileArray = await db
      .select()
      .from(readerProfiles)
      // @ts-ignore
      .where(eq(readerProfiles.id, focusId))
      .limit(1)

    if (profileArray.length === 0)
      return { isLoggedIn: true, currentStreak: 0, longestStreak: 0, secondsToday: 0 }

    const profile = profileArray[0]

    const todayStr = getTodayDateString()
    const logArray = await db
      .select()
      .from(readingLogs)
      // @ts-ignore
      .where(and(eq(readingLogs.readerId, focusId), eq(readingLogs.date, todayStr)))
      .limit(1)

    const secondsToday = logArray.length > 0 ? logArray[0].totalSeconds || 0 : 0

    return {
      isLoggedIn: true,
      currentStreak: profile.currentStreak || 0,
      longestStreak: profile.longestStreak || 0,
      secondsToday,
      hasReadToday: profile.lastActiveDate === todayStr && secondsToday > 0,
    }
  } catch (error) {
    console.error('Focus fetch error', error)
    return { isLoggedIn: false }
  }
}
