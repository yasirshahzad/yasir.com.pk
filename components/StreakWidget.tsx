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
  const targetSeconds = 1800 // 30 mins
  const activeSeconds = stats.secondsToday || 0
  const progressPercent = Math.min((activeSeconds / targetSeconds) * 100, 100)
  const minutesToday = Math.floor(activeSeconds / 60)

  // SVG Math
  const radius = 10
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div className="group relative z-50 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer">
      <span title="Your Daily Streak" className="flex items-center gap-1 text-orange-500">
        🔥 {stats.currentStreak}
      </span>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
      
      {/* Dynamic Visual Ring! */}
      <span title="Minutes focused today" className="relative flex items-center justify-center gap-2 text-primary-500 pr-1">
        <svg className="-rotate-90 w-5 h-5 absolute left-0" viewBox="0 0 24 24">
          <circle
            className="text-gray-200 dark:text-gray-700"
            strokeWidth="3"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="12"
            cy="12"
          />
          <circle
            className="text-primary-500 transition-all duration-1000 ease-out"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="12"
            cy="12"
          />
        </svg>
        <span className="pl-6">{minutesToday}m</span>
      </span>

      {/* Dropdown hover card */}
      <div className="absolute right-0 top-full mt-2 hidden w-56 rounded-xl border border-gray-200 bg-white p-4 shadow-xl group-hover:flex flex-col gap-4 dark:border-gray-700 dark:bg-gray-900">
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Daily Focus Goal</h4>
          <div className="text-base text-gray-900 dark:text-gray-100 space-y-1 mt-2">
            <p className="flex justify-between"><span>🔥 Streak</span> <span>{stats.currentStreak}</span></p>
            <p className="flex justify-between"><span>⏱️ Today</span> <span>{minutesToday} / 30m</span></p>
            
            {/* Visual Progress Bar in Hover Card */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            {progressPercent === 100 && (
              <p className="text-xs text-green-500 pt-2 text-center font-bold">Goal complete! 🏆</p>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-800 pt-3 flex flex-col gap-2">
          <Link
            href="/notes"
            className="flex items-center justify-between w-full rounded-md px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 transition"
          >
            <span>💾 My Notebook</span>
            <span>&rarr;</span>
          </Link>

          <button
            onClick={() => logout()}
            className="w-full text-left rounded-md px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}



