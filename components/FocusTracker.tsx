'use client'

import { useEffect, useRef } from 'react'
import { syncFocusTime } from '../app/actions/focusActions'

// Pings the backend every 30 seconds to strictly track focus time
const PING_INTERVAL = 30000 

export default function FocusTracker() {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isTracking = useRef(true) 

  useEffect(() => {
    // Only track when the user actually has the window visible/focused
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        isTracking.current = true
      } else {
        isTracking.current = false
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const tick = () => {
      if (isTracking.current) {
        // Ping silently in the background
        syncFocusTime(PING_INTERVAL / 1000).catch(console.error)
      }
    }

    // Start tracking loop
    timerRef.current = setInterval(tick, PING_INTERVAL)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return null // Ghost Tracker (No UI)
}
