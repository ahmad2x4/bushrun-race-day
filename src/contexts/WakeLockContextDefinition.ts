import { createContext } from 'react'

export interface WakeLockContextType {
  isSupported: boolean
  isActive: boolean
  isRequesting: boolean
  error: string | null
  request: () => Promise<boolean>
  release: () => Promise<boolean>
}

export const WakeLockContext = createContext<WakeLockContextType | null>(null)