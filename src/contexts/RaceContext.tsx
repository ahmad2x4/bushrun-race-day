import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Race, Runner } from '../types'
import { db } from '../db'
import { RaceContext } from './RaceContextDefinition'

interface RaceProviderProps {
  children: ReactNode
}

export function RaceProvider({ children }: RaceProviderProps) {
  const [currentRace, setCurrentRace] = useState<Race | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(Date.now())
  const [isRaceRunning, setIsRaceRunning] = useState(false)
  const [isTestingMode, setIsTestingMode] = useState(false)

  // Global timer effect - always running for race persistence
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, isTestingMode ? 10 : 100) // 10x faster in testing mode
    return () => clearInterval(interval)
  }, [isTestingMode])

  const updateRace = async (race: Race) => {
    await db.saveRace(race)
    setCurrentRace(race)
  }

  const deleteCurrentRace = async () => {
    if (currentRace) {
      await db.deleteRace(currentRace.id)
      setCurrentRace(null)
      setIsRaceRunning(false)
    }
  }

  const startRace = async () => {
    if (!currentRace || currentRace.start_time) return
    
    const now = Date.now()
    const updatedRace = { 
      ...currentRace, 
      start_time: now,
      status: 'active' as const
    }
    
    await updateRace(updatedRace)
    setIsRaceRunning(true)
  }

  const getElapsedTime = () => {
    if (!currentRace?.start_time || !isRaceRunning) return 0
    const realElapsed = Math.max(0, currentTime - currentRace.start_time)
    return isTestingMode ? realElapsed * 10 : realElapsed // 10x faster in testing mode
  }

  // Check if all checked-in runners have finished
  const areAllRunnersFinished = (race: Race) => {
    const checkedInRunners = race.runners.filter(r => r.checked_in)
    if (checkedInRunners.length === 0) return false
    return checkedInRunners.every(r => r.finish_time !== undefined)
  }

  const recordFinishTime = async (runner: Runner) => {
    if (!isRaceRunning || !currentRace) return
    
    runner.finish_time = getElapsedTime()
    
    const updatedRace = { ...currentRace, runners: [...currentRace.runners] }
    
    // Check if all runners have finished and auto-complete race
    if (areAllRunnersFinished(updatedRace)) {
      updatedRace.status = 'finished'
      setIsRaceRunning(false)
    }
    
    await updateRace(updatedRace)
  }

  const value = {
    currentRace,
    setCurrentRace,
    updateRace,
    deleteCurrentRace,
    currentTime,
    isRaceRunning,
    isTestingMode,
    setIsRaceRunning,
    setIsTestingMode,
    startRace,
    getElapsedTime,
    recordFinishTime
  }

  return (
    <RaceContext.Provider value={value}>
      {children}
    </RaceContext.Provider>
  )
}

