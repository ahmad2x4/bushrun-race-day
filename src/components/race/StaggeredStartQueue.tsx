import { useMemo, memo, useEffect, useRef, useState } from 'react'
import type { Race, Runner } from '../../types'
import { timeStringToMs } from '../../raceLogic'
import { playStartBeep, getAudioState, initializeAudio, type AudioState } from '../../utils/audioUtils'

interface StaggeredStartQueueProps {
  currentRace: Race
  elapsedTime: number
  showPreRace?: boolean
  audioEnabled?: boolean
}

function StaggeredStartQueue({ currentRace, elapsedTime, showPreRace = false, audioEnabled = true }: StaggeredStartQueueProps) {

  // Audio and visual alert state
  const [audioState, setAudioState] = useState<AudioState>(getAudioState())
  const [visualAlert, setVisualAlert] = useState<string | null>(null)

  // Get checked-in runners with their handicaps - memoized
  const checkedInRunners = useMemo(() =>
    currentRace.runners.filter(r => r.checked_in),
    [currentRace.runners]
  )
  
  // Create start groups and upcoming groups - memoized complex calculations
  const upcomingGroups = useMemo(() => {
    // Create start groups - runners who start at the same time
    const startGroups = new Map<number, Runner[]>()
    
    checkedInRunners.forEach(runner => {
      const handicapStr = runner.distance === '5km'
        ? runner.current_handicap_5k
        : runner.current_handicap_10k

      if (!handicapStr || handicapStr === '00:00') return
      
      const handicapMs = timeStringToMs(handicapStr)
      
      if (!startGroups.has(handicapMs)) {
        startGroups.set(handicapMs, [])
      }
      startGroups.get(handicapMs)!.push(runner)
    })

    // Sort groups by start time (handicap)
    const sortedStartTimes = Array.from(startGroups.keys()).sort((a, b) => a - b)
    
    // Show groups - for pre-race show all, during race filter out those that started more than 2 seconds ago
    return sortedStartTimes
      .filter(startTime => {
        if (showPreRace) return true // Show all groups in pre-race mode

        const timeUntilStart = startTime - elapsedTime
        // Show if not started yet OR started within last 2 seconds
        return timeUntilStart > -2000
      })
      .map(startTime => ({
        startTime,
        runners: startGroups.get(startTime)!,
        timeUntilStart: startTime - elapsedTime,
        hasStarted: !showPreRace && startTime <= elapsedTime
      }))
      .sort((a, b) => a.startTime - b.startTime)
  }, [checkedInRunners, elapsedTime, showPreRace])

  // Track audio trigger attempts and successful plays separately
  const audioTriggeredRef = useRef<Set<number>>(new Set()) // Successfully triggered audio
  const audioAttemptedRef = useRef<Set<number>>(new Set()) // Attempted but may have failed

  // Audio initialization effect - always try to initialize audio
  useEffect(() => {
    const currentAudioState = getAudioState()
    setAudioState(currentAudioState)

    // Always try to initialize audio when race starts (not in pre-race)
    if (!showPreRace && audioEnabled && !currentAudioState.isInitialized) {
      console.log('🔊 Auto-initializing audio for race')
      initializeAudio().then(success => {
        if (success) {
          const newState = getAudioState()
          setAudioState(newState)
          console.log('✅ Audio initialized successfully')
        } else {
          console.warn('⚠️ Audio initialization failed - will use visual alerts as fallback')
        }
      }).catch(error => {
        console.warn('⚠️ Audio initialization error:', error)
      })
    }
  }, [showPreRace, audioEnabled])


  // Visual alert trigger function
  const triggerVisualAlert = (message: string) => {
    setVisualAlert(message)
    setTimeout(() => setVisualAlert(null), 4000) // Clear after 4 seconds
  }

  // Audio trigger effect - play beep 4 seconds before start time
  useEffect(() => {
    if (showPreRace || !audioEnabled) return // No audio in pre-race mode or when disabled

    upcomingGroups.forEach(group => {
      const startTime = group.startTime
      const timeUntilStart = group.timeUntilStart
      const runnerNames = group.runners.map(r => `#${r.member_number} ${r.full_name}`).join(', ')

      // Trigger audio 4 seconds before start (narrow window for precise timing)
      // Window: 4200ms to 3800ms gives 400ms window centered at 4000ms
      const shouldTriggerAudio = timeUntilStart <= 4200 && timeUntilStart > 3800
      const alreadyTriggered = audioTriggeredRef.current.has(startTime)
      const alreadyAttempted = audioAttemptedRef.current.has(startTime)

      if (shouldTriggerAudio && !alreadyTriggered) {
        // If we haven't attempted yet, or if we attempted but audio wasn't initialized, try again
        const shouldRetry = !alreadyAttempted || (!audioState.isInitialized && alreadyAttempted)

        if (shouldRetry) {
          audioAttemptedRef.current.add(startTime)
          console.log(`🔊 Attempting beep for group starting in ${Math.round(timeUntilStart/1000)}s: ${runnerNames}`)
          console.log(`🔍 Audio state: initialized=${audioState.isInitialized}, mobile=${audioState.isMobile}, gesture=${audioState.requiresUserGesture}`)

          // Try to initialize audio if not already done
          if (!audioState.isInitialized) {
            console.log('🔊 Re-attempting audio initialization for upcoming group')
            initializeAudio().then(initSuccess => {
              if (initSuccess) {
                setAudioState(getAudioState())
                console.log('✅ Audio re-initialized successfully, now playing beep')
                return playStartBeep()
              } else {
                console.warn('⚠️ Audio re-initialization failed')
                return Promise.resolve(false)
              }
            }).then(playSuccess => {
              if (playSuccess) {
                audioTriggeredRef.current.add(startTime)
                console.log(`✅ Beep played successfully for group: ${runnerNames}`)
              } else {
                console.warn(`❌ Beep failed for group: ${runnerNames} - showing visual alert`)
                triggerVisualAlert(`🏃 START NOW: ${runnerNames}`)
              }
            }).catch(error => {
              console.error('❌ Audio initialization/play error:', error)
              triggerVisualAlert(`🏃 START NOW: ${runnerNames}`)
            })
          } else {
            // Audio already initialized, just play the beep
            playStartBeep().then(success => {
              if (success) {
                audioTriggeredRef.current.add(startTime)
                console.log(`✅ Beep played successfully for group: ${runnerNames}`)
              } else {
                console.warn(`❌ Beep failed for group: ${runnerNames} - showing visual alert`)
                triggerVisualAlert(`🏃 START NOW: ${runnerNames}`)
              }
            }).catch(error => {
              console.error('❌ Failed to play beep:', error)
              triggerVisualAlert(`🏃 START NOW: ${runnerNames}`)
            })
          }
        }
      }

      // Clean up tracking for groups that have passed (increased cleanup time)
      if (timeUntilStart < -15000) {
        audioTriggeredRef.current.delete(startTime)
        audioAttemptedRef.current.delete(startTime)
      }
    })
  }, [upcomingGroups, showPreRace, audioEnabled, audioState])

  const formatCountdown = (milliseconds: number) => {
    if (milliseconds <= 0) return "STARTED"
    
    const totalSeconds = Math.ceil(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    return `${seconds}s`
  }

  const msToTimeString = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  if (upcomingGroups.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-center text-gray-600 dark:text-gray-400">
          All runners have started
        </h3>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col flex-1">
      <h3 className="font-semibold text-lg mb-3 text-center">
        Staggered Start Queue
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mt-1">
            Audio: {audioState.isInitialized ? '✅' : '❌'} |
            Mobile: {audioState.isMobile ? '📱' : '💻'} |
            Gesture: {audioState.requiresUserGesture ? '👆' : '🔄'}
          </div>
        )}
      </h3>


      {/* Visual alert overlay */}
      {visualAlert && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 rounded-lg animate-pulse">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
              {visualAlert}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              Audio unavailable - Visual alert only
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3 flex-1 overflow-y-auto">
        {upcomingGroups.map((group, index) => {
          const isNext = !group.hasStarted && index === upcomingGroups.findIndex(g => !g.hasStarted)
          const isStarting = group.timeUntilStart <= 3000 && group.timeUntilStart > 0
          
          return (
            <div 
              key={group.startTime}
              className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                group.hasStarted
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 opacity-75'
                  : isStarting
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 animate-pulse'
                  : isNext
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    group.hasStarted ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Start Delay: {msToTimeString(group.startTime)}
                  </span>
                  {isNext && !group.hasStarted && (
                    <span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full font-bold">
                      NEXT
                    </span>
                  )}
                  {isStarting && (
                    <span className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded-full font-bold">
                      STARTING!
                    </span>
                  )}
                </div>
                
                <div className={`text-lg font-bold tabular-nums ${
                  group.hasStarted
                    ? 'text-green-600 dark:text-green-400'
                    : isStarting
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {showPreRace
                    ? `Starts at ${msToTimeString(group.startTime)}`
                    : formatCountdown(group.timeUntilStart)
                  }
                </div>
              </div>
              
              <div className="grid gap-2" style={{gridTemplateColumns: `repeat(${Math.min(group.runners.length, 3)}, 1fr)`}}>
                {group.runners.map(runner => (
                  <div 
                    key={runner.member_number}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      runner.distance === '5km'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                    }`}
                  >
                    #{runner.member_number} {runner.full_name}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default memo(StaggeredStartQueue)