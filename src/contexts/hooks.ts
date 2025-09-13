import { useContext } from 'react'
import { AppContext } from './AppContextDefinition'
import { RaceContext } from './RaceContextDefinition'

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export function useRace() {
  const context = useContext(RaceContext)
  if (context === undefined) {
    throw new Error('useRace must be used within a RaceProvider')
  }
  return context
}