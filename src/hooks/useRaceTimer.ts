import { useState, useEffect } from 'react'
import type { Race, Runner } from '../types'

interface UseRaceTimerOptions {
  race: Race | null
  isTestingMode?: boolean
  onRaceComplete?: () => void
}

export function useRaceTimer({ race, isTestingMode = false, onRaceComplete }: UseRaceTimerOptions) {
  const [currentTime, setCurrentTime] = useState<number>(Date.now())
  const [isRunning, setIsRunning] = useState(false)

  // Global timer effect - always running for race persistence
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, isTestingMode ? 10 : 100) // 10x faster in testing mode
    return () => clearInterval(interval)
  }, [isTestingMode])

  // Initialize race running state from database
  useEffect(() => {
    if (race?.start_time && race.status === 'active') {
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }, [race])

  const getElapsedTime = () => {
    if (!race?.start_time || !isRunning) return 0
    const realElapsed = Math.max(0, currentTime - race.start_time)
    return isTestingMode ? realElapsed * 10 : realElapsed // 10x faster in testing mode
  }

  const getRunnerStartTime = (handicapTime: string) => {
    if (!race?.start_time) return 0
    
    // Parse handicap time (e.g., "5:30" -> 330000ms)
    const [minutes, seconds] = handicapTime.split(':').map(Number)
    const handicapMs = (minutes * 60 + seconds) * 1000
    
    return race.start_time + handicapMs
  }

  const getRunnerElapsedTime = (runner: Runner) => {
    const startTime = getRunnerStartTime(
      runner.distance === '5km' ? runner.current_handicap_5k || '0:00' : runner.current_handicap_10k || '0:00'
    )
    
    if (startTime > currentTime) return 0 // Not started yet
    
    const realElapsed = currentTime - startTime
    return isTestingMode ? realElapsed * 10 : realElapsed
  }

  const areAllRunnersFinished = (raceData: Race) => {
    const checkedInRunners = raceData.runners.filter(r => r.checked_in)
    if (checkedInRunners.length === 0) return false
    return checkedInRunners.every(r => r.finish_time !== undefined)
  }

  const recordFinishTime = (): number => {
    const finishTime = getElapsedTime()
    
    // Check if all runners finished for auto-completion
    if (race && areAllRunnersFinished(race)) {
      setIsRunning(false)
      onRaceComplete?.()
    }
    
    return finishTime
  }

  const formatTime = (ms: number): string => {
    const totalSeconds = ms / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = (totalSeconds % 60).toFixed(1)
    return `${minutes}:${seconds.padStart(4, '0')}`
  }

  const formatCountdown = (ms: number): string => {
    if (ms <= 0) return "GO!"
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : seconds.toString()
  }

  return {
    currentTime,
    isRunning,
    setIsRunning,
    getElapsedTime,
    getRunnerStartTime,
    getRunnerElapsedTime,
    recordFinishTime,
    formatTime,
    formatCountdown,
    areAllRunnersFinished
  }
}