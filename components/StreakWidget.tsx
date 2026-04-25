'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { getReaderStats, startFocusSession, endFocusSession } from '@/app/actions/focusActions'
import { logout } from '@/app/login/actions'

type StatsData = {
  isLoggedIn: boolean
  currentStreak?: number
  secondsToday?: number
  longestStreak?: number
  activeSessionStart?: string | null
  focusGoalMinutes?: number
}

export default function StreakWidget() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const data = await getReaderStats()
      if (data) setStats(data as StatsData)
    } catch {
      // Silently ignore — stale action IDs or network errors shouldn't crash the widget
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // Timer Tick
  useEffect(() => {
    if (!stats?.activeSessionStart) {
      setTimeLeft(null)
      return
    }

    const tick = () => {
      const start = new Date(stats.activeSessionStart!).getTime()
      const now = new Date().getTime()
      const elapsedSeconds = Math.floor((now - start) / 1000)
      const totalSeconds = (stats.focusGoalMinutes || 25) * 60
      const remaining = Math.max(0, totalSeconds - elapsedSeconds)
      
      setTimeLeft(remaining)

      if (remaining === 0 && stats.activeSessionStart) {
        // Auto-end session when time is up? 
        // Or let user end it. For now, we just stay at 0.
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [stats?.activeSessionStart, stats?.focusGoalMinutes])

  const handleStartFocus = async (mins: number) => {
    setIsSyncing(true)
    const res = await startFocusSession(mins)
    if (res.success) await fetchStats()
    setIsSyncing(false)
  }

  const handleEndFocus = async () => {
    setIsSyncing(true)
    const res = await endFocusSession()
    if (res.success) await fetchStats()
    setIsSyncing(false)
    
    // Notify user if goal met
    if (timeLeft === 0) {
      alert("Focus session complete! Great work. 🔥")
    }
  }

  if (!stats) return null // Hide while fetching gracefully

  if (!stats.isLoggedIn) {
    return (
      <Link
        href="/login"
        className="bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/40 dark:text-primary-400 dark:hover:bg-primary-900/60 border-primary-200 dark:border-primary-800 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all"
      >
        Sign In
      </Link>
    )
  }

  // They are logged in!
  const targetSeconds = 1800 // 30 mins goal
  const activeSeconds = stats.secondsToday || 0
  const progressPercent = Math.min((activeSeconds / targetSeconds) * 100, 100)
  const minutesToday = Math.floor(activeSeconds / 60)

  // SVG Math
  const radius = 10
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isFocusing = timeLeft !== null

  return (
    <div className="group relative z-50 flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
      <span title="Your Daily Streak" className={`flex items-center gap-1 ${stats.currentStreak ? 'text-orange-500' : 'text-gray-400'}`}>
        🔥 {stats.currentStreak || 0}
      </span>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

      {/* Dynamic Visual Ring! */}
      <span
        title={isFocusing ? 'Focus in progress' : 'Minutes focused today'}
        className={`${isFocusing ? 'text-rose-500' : 'text-primary-500'} relative flex items-center justify-center gap-2 pr-1`}
      >
        <svg className={`absolute left-0 h-5 w-5 -rotate-90 ${isFocusing ? 'animate-pulse' : ''}`} viewBox="0 0 24 24">
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
            className={`${isFocusing ? 'text-rose-500' : 'text-primary-500'} transition-all duration-1000 ease-out`}
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
        <span className="pl-6">{isFocusing ? formatTime(timeLeft) : `${minutesToday}m`}</span>
      </span>

      {/* Dropdown hover card */}
      <div className="absolute top-full right-0 hidden w-64 flex-col gap-0 group-hover:flex">
        {/* Transparent bridge */}
        <div className="h-2 w-full"></div>
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
          
          {/* Header with Logout */}
          <div className="flex items-center justify-between border-b border-gray-50 pb-3 dark:border-gray-900">
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Focus Hub</span>
             <button onClick={() => logout()} className="text-[10px] font-bold text-gray-400 hover:text-rose-500 transition-colors">Logout</button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4">
             <div className="rounded-2xl bg-gray-50 p-3 dark:bg-gray-900/50">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Streak</p>
                <p className="text-xl font-black text-orange-500">{stats.currentStreak || 0}d</p>
             </div>
             <div className="rounded-2xl bg-gray-50 p-3 dark:bg-gray-900/50">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Today</p>
                <p className="text-xl font-black text-primary-500">{minutesToday}m</p>
             </div>
          </div>

          {/* Pomodoro Section */}
          <div className="space-y-3">
             {isFocusing ? (
               <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/20 text-center">
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase mb-1">Deep Focus Active</p>
                  <p className="text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums">{formatTime(timeLeft)}</p>
                  <button 
                    disabled={isSyncing}
                    onClick={handleEndFocus}
                    className="mt-3 w-full rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-all disabled:opacity-50 shadow-lg shadow-rose-200 dark:shadow-none"
                  >
                    {isSyncing ? 'Syncing...' : 'End Focus Session'}
                  </button>
               </div>
             ) : (
               <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Start focus session</p>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                       disabled={isSyncing}
                       onClick={() => handleStartFocus(25)}
                       className="rounded-xl border border-gray-100 bg-white py-2.5 text-xs font-bold hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                     >
                       25 min
                     </button>
                     <button 
                       disabled={isSyncing}
                       onClick={() => handleStartFocus(50)}
                       className="rounded-xl border border-gray-100 bg-white py-2.5 text-xs font-bold hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                     >
                       50 min
                     </button>
                  </div>
               </div>
             )}
          </div>

          {/* My Notebook Link */}
          <Link
            href="/notes"
            className="flex items-center justify-between rounded-2xl bg-primary-600 p-3 text-xs font-bold text-white hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 dark:shadow-none"
          >
            <span>📓 My Reading Notes</span>
            <span>&rarr;</span>
          </Link>

        </div>
      </div>
    </div>
  )
}
