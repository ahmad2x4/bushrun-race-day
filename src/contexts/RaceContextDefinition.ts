import { createContext } from 'react'
import type { Race, Runner } from '../types'

export interface RaceContextType {
  currentRace: Race | null
  setCurrentRace: (race: Race | null) => void
  updateRace: (race: Race) => Promise<void>
  deleteCurrentRace: () => Promise<void>
  
  // Race timer state
  currentTime: number
  isRaceRunning: boolean
  isTestingMode: boolean
  setIsRaceRunning: (running: boolean) => void
  setIsTestingMode: (testing: boolean) => void
  
  // Race timer functions
  startRace: () => Promise<void>
  getElapsedTime: () => number
  recordFinishTime: (runner: Runner) => Promise<void>
}

export const RaceContext = createContext<RaceContextType | undefined>(undefined)