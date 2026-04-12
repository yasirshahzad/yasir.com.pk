'use server'

import { cookies } from 'next/headers'
import { db } from 'lib/db'
import { readerProfiles, readingLogs } from 'drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { createClient } from 'utils/supabase/server'

// Helper to get local date string YYYY-MM-DD
function getTodayDateString() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

// Ensure the Admin profile exists gracefully
async function getOrInstallAdminProfile() {
  const adminId = 'admin'
  try {
    const existing = await db.select().from(readerProfiles).where(eq(readerProfiles.id, adminId)).limit(1)
    if (existing.length === 0) {
      await db.insert(readerProfiles).values({ id: adminId, currentStreak: 0, longestStreak: 0 })
    }
  } catch (e) {
    console.error('Failed to query or seed admin account', e)
  }
  return adminId
}

export async function syncFocusTime(seconds: number) {
  if (!seconds || seconds <= 0) return { success: false }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, reason: 'Not authenticated as admin' }
  }

  try {
    const readerId = await getOrInstallAdminProfile()
    const todayStr = getTodayDateString()

    // 1. Log or update today's focus time
    const existingLogArray = await db.select()
      .from(readingLogs)
      .where(and(eq(readingLogs.readerId, readerId), eq(readingLogs.date, todayStr)))
      .limit(1)

    if (existingLogArray.length > 0) {
      await db.update(readingLogs)
        .set({ totalSeconds: (existingLogArray[0].totalSeconds || 0) + seconds })
        .where(eq(readingLogs.id, existingLogArray[0].id))
    } else {
      await db.insert(readingLogs).values({ readerId, date: todayStr, totalSeconds: seconds })
    }

    // 2. Refresh Streaks safely
    const profileArray = await db.select().from(readerProfiles).where(eq(readerProfiles.id, readerId)).limit(1)
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

        await db.update(readerProfiles)
          .set({
            lastActiveDate: todayStr,
            currentStreak: newStreak,
            longestStreak: newLongest
          })
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const focusId = 'admin'

    const profileArray = await db.select()
      .from(readerProfiles)
      .where(eq(readerProfiles.id, focusId))
      .limit(1)

    if (profileArray.length === 0) return null
    const profile = profileArray[0]

    const todayStr = getTodayDateString()
    const logArray = await db.select()
      .from(readingLogs)
      .where(and(eq(readingLogs.readerId, focusId), eq(readingLogs.date, todayStr)))
      .limit(1)

    const secondsToday = logArray.length > 0 ? (logArray[0].totalSeconds || 0) : 0

    return {
      currentStreak: profile.currentStreak || 0,
      longestStreak: profile.longestStreak || 0,
      secondsToday,
      hasReadToday: profile.lastActiveDate === todayStr && secondsToday > 0
    }
  } catch (error) {
    console.error('Focus fetch error', error)
    return null
  }
}
