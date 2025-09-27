import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useWakeLock } from '../hooks/useWakeLock'
import { useRace } from './hooks'
import type { WakeLockContextType } from './WakeLockContextDefinition'
import { WakeLockContext } from './WakeLockContextDefinition'

interface WakeLockProviderProps {
  children: ReactNode
}

export function WakeLockProvider({ children }: WakeLockProviderProps) {
  const wakeLock = useWakeLock()
  const { currentRace, getElapsedTime, isRaceRunning } = useRace()
  const elapsedTime = getElapsedTime()

  // Check if there are pending runners in staggered start queue
  const hasPendingRunners = (() => {
    if (!currentRace || !isRaceRunning) return false

    const checkedInRunners = currentRace.runners.filter(r => r.checked_in)
    if (checkedInRunners.length === 0) return false

    // Check if any runners haven't started yet (their start time is in the future)
    return checkedInRunners.some(runner => {
      const handicapStr = runner.distance === '5km'
        ? runner.current_handicap_5k
        : runner.current_handicap_10k

      if (!handicapStr) return false

      // Convert handicap time to milliseconds
      const handicapMs = (() => {
        const [minutes, seconds] = handicapStr.split(':').map(Number)
        return (minutes * 60 + seconds) * 1000
      })()

      // Runner starts at handicapMs after race start
      // If current elapsed time is less than handicap time, runner hasn't started
      return elapsedTime < handicapMs
    })
  })()

  // Auto-manage wake lock based on race state
  useEffect(() => {
    if (!wakeLock.isSupported) return

    if (hasPendingRunners && !wakeLock.isActive && !wakeLock.isRequesting) {
      console.log('🔒 Acquiring wake lock - runners pending in queue')
      wakeLock.request()
    } else if (!hasPendingRunners && wakeLock.isActive) {
      console.log('🔓 Releasing wake lock - no pending runners')
      wakeLock.release()
    }
  }, [hasPendingRunners, wakeLock])

  // Release wake lock when race ends or is reset
  useEffect(() => {
    if (!currentRace || currentRace.status === 'finished') {
      if (wakeLock.isActive) {
        console.log('🔓 Releasing wake lock - race completed or reset')
        wakeLock.release()
      }
    }
  }, [currentRace, wakeLock])

  const contextValue: WakeLockContextType = {
    isSupported: wakeLock.isSupported,
    isActive: wakeLock.isActive,
    isRequesting: wakeLock.isRequesting,
    error: wakeLock.error,
    request: wakeLock.request,
    release: wakeLock.release
  }

  return (
    <WakeLockContext.Provider value={contextValue}>
      {children}
    </WakeLockContext.Provider>
  )
}

