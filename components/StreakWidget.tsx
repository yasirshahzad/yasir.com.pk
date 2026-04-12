'use client'

import { useEffect, useState } from 'react'
import { getReaderStats } from 'app/actions/focusActions'

export default function StreakWidget() {
  const [stats, setStats] = useState<{ currentStreak: number, secondsToday: number } | null>(null)

  useEffect(() => {
    // Only fetch on client side to protect Next.js Static Site Generation caching.
    getReaderStats().then(data => {
      if (data) setStats(data)
    })

    // Poll every minute to update the widget seamlessly in standard UI without refresh
    const interval = setInterval(() => {
      getReaderStats().then(data => {
        if (data) setStats(data)
      })
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  if (!stats) return null

  // Don't show noise to new users until they have actually read something!
  if (stats.secondsToday === 0 && stats.currentStreak === 0) return null

  const minutesToday = Math.floor(stats.secondsToday / 60)

  return (
    <div className="group relative flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer">
      <span title="Your Daily Streak" className="flex items-center gap-1 text-orange-500">
        🔥 {stats.currentStreak}
      </span>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
      <span title="Minutes focused today" className="flex items-center gap-1 text-primary-500">
        ⏱️ {minutesToday}m
      </span>

      {/* Dropdown hover card */}
      <div className="absolute right-0 top-full mt-2 hidden w-48 rounded-xl border border-gray-200 bg-white p-4 shadow-xl group-hover:block dark:border-gray-700 dark:bg-gray-900 z-50">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Your Progress</h4>
        <div className="text-base text-gray-900 dark:text-gray-100">
          <p><strong>🔥 Daily Streak:</strong> {stats.currentStreak}</p>
          <p><strong>⏱️ Focus Today:</strong> {minutesToday} mins</p>
        </div>
      </div>
    </div>
  )
}
