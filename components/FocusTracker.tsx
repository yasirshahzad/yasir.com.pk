'use client'

import { useEffect, useRef } from 'react'
import { syncFocusTime } from '../app/actions/focusActions'

// Pings the backend every 30 seconds to strictly track focus time
const PING_INTERVAL = 30000

export default function FocusTracker() {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isTracking = useRef(true)
  const failCountRef = useRef(0)

  useEffect(() => {
    const handleVisibilityChange = () => {
      isTracking.current = document.visibilityState === 'visible'
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    const tick = async () => {
      if (!isTracking.current) return
      try {
        await syncFocusTime(PING_INTERVAL / 1000)
        failCountRef.current = 0 // reset on success
      } catch (err: unknown) {
        failCountRef.current += 1
        // If action IDs are stale (dev server recompiled), reload once to re-sync
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('Failed to find Server Action') || failCountRef.current >= 3) {
          if (timerRef.current) clearInterval(timerRef.current)
          window.location.reload()
        }
      }
    }

    timerRef.current = setInterval(tick, PING_INTERVAL)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return null
}
