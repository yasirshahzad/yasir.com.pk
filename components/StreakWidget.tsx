'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getReaderStats } from 'app/actions/focusActions'
import { logout } from 'app/login/actions'

type StatsData = {
  isLoggedIn: boolean
  currentStreak?: number
  secondsToday?: number
  longestStreak?: number
}

export default function StreakWidget() {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    getReaderStats().then(data => {
      if (data) setStats(data as StatsData)
    })

    const interval = setInterval(() => {
      getReaderStats().then(data => {
        if (data) setStats(data as StatsData)
      })
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  if (!stats) return null // Hide while fetching gracefully

  if (!stats.isLoggedIn) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-600 hover:bg-primary-100 dark:bg-primary-900/40 dark:text-primary-400 dark:hover:bg-primary-900/60 transition-all border border-primary-200 dark:border-primary-800"
      >
        Sign In to Track Streaks
      </Link>
    )
  }

  // They are logged in!
  const minutesToday = Math.floor((stats.secondsToday || 0) / 60)

  return (
    <div className="group relative z-50 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer">
      <span title="Your Daily Streak" className="flex items-center gap-1 text-orange-500">
        🔥 {stats.currentStreak}
      </span>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
      <span title="Minutes focused today" className="flex items-center gap-1 text-primary-500">
        ⏱️ {minutesToday}m
      </span>

      {/* Dropdown hover card */}
      <div className="absolute right-0 top-full mt-2 hidden w-56 rounded-xl border border-gray-200 bg-white p-4 shadow-xl group-hover:flex flex-col gap-4 dark:border-gray-700 dark:bg-gray-900">
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Your Progress</h4>
          <div className="text-base text-gray-900 dark:text-gray-100">
            <p><strong>🔥 Daily Streak:</strong> {stats.currentStreak}</p>
            <p><strong>⏱️ Focus Today:</strong> {minutesToday} mins</p>
          </div>
        </div>
        
        <button
          onClick={() => logout()}
          className="w-full rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

