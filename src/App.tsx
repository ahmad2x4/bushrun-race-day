import { useState, useEffect, Suspense, lazy } from 'react'
import type { AppView, ClubConfig, Race } from './types'
import { initializeDatabase, db } from './db'
import LoadingView from './components/ui/LoadingView'
import ConfirmDialog from './components/ui/ConfirmDialog'
import ErrorBoundary from './components/ui/ErrorBoundary'
import ViewErrorFallback from './components/ui/ViewErrorFallback'

// Lazy load views for code splitting
const SettingsView = lazy(() => import('./components/SettingsView'))
const SetupView = lazy(() => import('./components/views/SetupView'))
const CheckinView = lazy(() => import('./components/views/CheckinView'))
const RaceDirectorView = lazy(() => import('./components/views/RaceDirectorView'))
const ResultsView = lazy(() => import('./components/views/ResultsView'))

function App() {
  const [currentView, setCurrentView] = useState<AppView>('setup')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return true
    
    // Initialize from localStorage first
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      try {
        return JSON.parse(saved)
      } catch {
        // If parsing fails, remove invalid data and use default
        localStorage.removeItem('darkMode')
      }
    }
    
    // If no saved preference, check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true
    }
    
    // Final fallback to dark mode as default
    return true
  })

  // Apply dark mode class to html element and persist preference
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const defaultClubConfig: ClubConfig = {
    name: "Berowra Bushrunners",
    primary_color: "#3b82f6",
    secondary_color: "#1f2937",
    enable_time_adjustment: true // Default: enabled
  }

  const [currentRace, setCurrentRace] = useState<Race | null>(null)
  const [isDbInitialized, setIsDbInitialized] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [clubConfig, setClubConfig] = useState<ClubConfig>(defaultClubConfig)
  
  // Global race timer state
  const [currentTime, setCurrentTime] = useState<number>(Date.now())
  const [isRaceRunning, setIsRaceRunning] = useState(false)
  const [isTestingMode, setIsTestingMode] = useState(() => {
    // Initialize from localStorage or default to false
    const saved = localStorage.getItem('testingMode')
    return saved ? JSON.parse(saved) : false
  })

  // Persist testing mode preference
  useEffect(() => {
    localStorage.setItem('testingMode', JSON.stringify(isTestingMode))
  }, [isTestingMode])

  // Global timer effect - always running for race persistence
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, isTestingMode ? 10 : 100) // 10x faster in testing mode
    return () => clearInterval(interval)
  }, [isTestingMode])

  // Initialize database on app load
  useEffect(() => {
    const initDb = async () => {
      try {
        await initializeDatabase()
        
        // Validate and repair any corrupted data after potential crashes
        await db.validateAndRepairData()
        
        setIsDbInitialized(true)
        
        // Load club configuration
        const config = await db.getClubConfig()
        setClubConfig(config)
        
        // Try to load current race
        const race = await db.getCurrentRace()
        if (race) {
          setCurrentRace(race)
          
          // Initialize race running state from database
          if (race.start_time && race.status === 'active') {
            setIsRaceRunning(true)
          }
          
          // Set appropriate view based on race status
          if (race.status === 'checkin') setCurrentView('checkin')
          else if (race.status === 'active') setCurrentView('race-director')
          else if (race.status === 'finished') setCurrentView('results')
        }
      } catch (error) {
        console.error('Failed to initialize database:', error)
        setIsDbInitialized(true) // Continue anyway
      }
    }
    
    initDb()
  }, [])

  // Global race timer functions
  const startRace = async () => {
    if (!currentRace || currentRace.start_time) return

    const now = Date.now()
    const updatedRace = {
      ...currentRace,
      start_time: now,
      status: 'active' as const
    }

    await db.saveRace(updatedRace)
    setCurrentRace(updatedRace)
    setIsRaceRunning(true)
  }

  const stopRace = () => {
    setIsRaceRunning(false)
  }

  const getElapsedTime = () => {
    if (!currentRace?.start_time || !isRaceRunning) return 0
    const realElapsed = Math.max(0, currentTime - currentRace.start_time)
    return isTestingMode ? realElapsed * 10 : realElapsed // 10x faster in testing mode
  }


  // Removed recordFinishTime - now handled by FinishLineRegistration component

  const renderView = () => {
    if (!isDbInitialized) {
      return <LoadingView />
    }
    
    switch (currentView) {
      case 'setup':
        return (
          <ErrorBoundary 
            fallback={<ViewErrorFallback viewName="Setup" onNavigateHome={() => setCurrentView('setup')} />}
          >
            <Suspense fallback={<LoadingView />}>
              <SetupView currentRace={currentRace} setCurrentRace={setCurrentRace} setCurrentView={setCurrentView} setShowResetConfirm={setShowResetConfirm} />
            </Suspense>
          </ErrorBoundary>
        )
      case 'checkin':
        return (
          <ErrorBoundary 
            fallback={<ViewErrorFallback viewName="Check-in" onNavigateHome={() => setCurrentView('setup')} />}
          >
            <Suspense fallback={<LoadingView />}>
              <CheckinView currentRace={currentRace} setCurrentRace={setCurrentRace} clubConfig={clubConfig} />
            </Suspense>
          </ErrorBoundary>
        )
      case 'race-director':
        return (
          <ErrorBoundary 
            fallback={<ViewErrorFallback viewName="Race Director" onNavigateHome={() => setCurrentView('setup')} />}
          >
            <Suspense fallback={<LoadingView />}>
              <RaceDirectorView
                currentRace={currentRace}
                isRaceRunning={isRaceRunning}
                elapsedTime={getElapsedTime()}
                startRace={startRace}
                stopRace={stopRace}
                isTestingMode={isTestingMode}
                setIsTestingMode={setIsTestingMode}
                setCurrentView={setCurrentView}
                setCurrentRace={setCurrentRace}
              />
            </Suspense>
          </ErrorBoundary>
        )
      case 'results':
        return (
          <ErrorBoundary 
            fallback={<ViewErrorFallback viewName="Results" onNavigateHome={() => setCurrentView('setup')} />}
          >
            <Suspense fallback={<LoadingView />}>
              <ResultsView currentRace={currentRace} setCurrentRace={setCurrentRace} />
            </Suspense>
          </ErrorBoundary>
        )
      case 'settings':
        return (
          <ErrorBoundary 
            fallback={<ViewErrorFallback viewName="Settings" onNavigateHome={() => setCurrentView('setup')} />}
          >
            <Suspense fallback={<LoadingView />}>
              <SettingsView clubConfig={clubConfig} setClubConfig={setClubConfig} />
            </Suspense>
          </ErrorBoundary>
        )
      default:
        return (
          <ErrorBoundary 
            fallback={<ViewErrorFallback viewName="Setup" onNavigateHome={() => setCurrentView('setup')} />}
          >
            <Suspense fallback={<LoadingView />}>
              <SetupView currentRace={currentRace} setCurrentRace={setCurrentRace} setCurrentView={setCurrentView} setShowResetConfirm={setShowResetConfirm} />
            </Suspense>
          </ErrorBoundary>
        )
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold" style={{color: clubConfig.primary_color}}>
              {clubConfig.name}
            </h1>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex space-x-1">
              <button
                onClick={() => setCurrentView('setup')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'setup' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Setup
              </button>
              <button
                onClick={() => setCurrentView('checkin')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'checkin' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Check-in
              </button>
              <button
                onClick={() => setCurrentView('race-director')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'race-director' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Race Director
              </button>
              <button
                onClick={() => setCurrentView('results')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'results' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Results
              </button>
            </nav>

            {/* Settings and Theme Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentView('settings')}
                className={`p-2 rounded-md ${
                  currentView === 'settings' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
                }`}
                aria-label="Club settings"
              >
                ⚙️
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              {/* Mobile Hamburger Button - Show only on mobile, positioned after theme toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-label="Toggle mobile menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-x-0 top-16 z-50 bg-white dark:bg-gray-800 shadow-lg">
            <nav className="px-4 py-6 space-y-2">
              <button
                onClick={() => {
                  setCurrentView('setup')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-md text-base font-medium ${
                  currentView === 'setup' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Setup
              </button>
              <button
                onClick={() => {
                  setCurrentView('checkin')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-md text-base font-medium ${
                  currentView === 'checkin' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Check-in
              </button>
              <button
                onClick={() => {
                  setCurrentView('race-director')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-md text-base font-medium ${
                  currentView === 'race-director' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Race Director
              </button>
              <button
                onClick={() => {
                  setCurrentView('results')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-md text-base font-medium ${
                  currentView === 'results' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Results
              </button>
              <hr className="my-4 border-gray-200 dark:border-gray-600" />
              <button
                onClick={() => {
                  setCurrentView('settings')
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-md text-base font-medium flex items-center space-x-2 ${
                  currentView === 'settings' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <span>⚙️</span>
                <span>Settings</span>
              </button>
              <button
                onClick={() => {
                  setIsDarkMode(!isDarkMode)
                  setIsMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <span>{isDarkMode ? '☀️' : '🌙'}</span>
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
        {renderView()}
      </main>
      
      {/* Global Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={async () => {
          if (currentRace) {
            await db.deleteRace(currentRace.id)
            setCurrentRace(null)
            setShowResetConfirm(false)
          }
        }}
        title="Reset Race Configuration?"
        message="This will permanently delete the current race data and return to the CSV upload screen. This action cannot be undone."
        confirmText="Yes, Reset Race"
      />
      </div>
    </ErrorBoundary>
  )
}

export default App
