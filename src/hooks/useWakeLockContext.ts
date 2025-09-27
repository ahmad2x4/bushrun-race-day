import { useContext } from 'react'
import { WakeLockContext } from '../contexts/WakeLockContextDefinition'
import type { WakeLockContextType } from '../contexts/WakeLockContextDefinition'

export function useWakeLockContext(): WakeLockContextType {
  const context = useContext(WakeLockContext)
  if (!context) {
    throw new Error('useWakeLockContext must be used within a WakeLockProvider')
  }
  return context
}