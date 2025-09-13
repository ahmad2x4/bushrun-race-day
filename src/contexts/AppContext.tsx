import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AppView, ClubConfig } from '../types'
import { db } from '../db'
import { AppContext } from './AppContextDefinition'

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [currentView, setCurrentView] = useState<AppView>('setup')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage or default to false
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  
  const defaultClubConfig: ClubConfig = {
    name: "Berowra Bushrunners",
    primary_color: "#3b82f6",
    secondary_color: "#1f2937"
  }
  
  const [clubConfig, setClubConfig] = useState<ClubConfig>(defaultClubConfig)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Apply dark mode class to html element and persist preference
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const updateClubConfig = async (config: ClubConfig) => {
    await db.saveClubConfig(config)
    setClubConfig(config)
  }

  const value = {
    currentView,
    setCurrentView,
    isDarkMode,
    setIsDarkMode,
    clubConfig,
    setClubConfig,
    updateClubConfig,
    showResetConfirm,
    setShowResetConfirm
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

