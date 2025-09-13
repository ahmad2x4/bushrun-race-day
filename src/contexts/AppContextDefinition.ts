import { createContext } from 'react'
import type { AppView, ClubConfig } from '../types'

export interface AppContextType {
  // Navigation
  currentView: AppView
  setCurrentView: (view: AppView) => void
  
  // Theme
  isDarkMode: boolean
  setIsDarkMode: (dark: boolean) => void
  
  // Club configuration
  clubConfig: ClubConfig
  setClubConfig: (config: ClubConfig) => void
  updateClubConfig: (config: ClubConfig) => Promise<void>
  
  // Dialogs
  showResetConfirm: boolean
  setShowResetConfirm: (show: boolean) => void
}

export const AppContext = createContext<AppContextType | undefined>(undefined)