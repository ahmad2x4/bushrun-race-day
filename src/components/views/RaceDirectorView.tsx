import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Race, AppView, ClubConfig } from '../../types'
import { timeStringToMs } from '../../raceLogic'
import { db } from '../../db'
import StaggeredStartQueue from '../race/StaggeredStartQueue'
import FinishLineRegistration from '../race/FinishLineRegistration'
import WakeLockIndicator from '../ui/WakeLockIndicator'
import TimekeeperModal from '../race/TimekeeperModal'

interface RaceDirectorViewProps {
  currentRace: Race | null
  isRaceRunning: boolean
  elapsedTime: number
  startRace: () => void
  stopRace: () => void
  isTestingMode: boolean
  setIsTestingMode: (mode: boolean) => void
  setCurrentView: (view: AppView) => void
  setCurrentRace: (race: Race | null) => void
  clubConfig: ClubConfig
}

function RaceDirectorView({
  currentRace,
  isRaceRunning,
  elapsedTime,
  startRace,
  stopRace,
  isTestingMode,
  setIsTestingMode,
  setCurrentView,
  setCurrentRace,
  clubConfig
}: RaceDirectorViewProps) {
  const [isFocusMode, setIsFocusMode] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return JSON.parse(localStorage.getItem('raceDirectorFocusMode') || 'false')
    } catch {
      return false
    }
  })

  const [isTimekeeperModalOpen, setIsTimekeeperModalOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('raceDirectorFocusMode', JSON.stringify(isFocusMode))
  }, [isFocusMode])

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const ms = Math.floor((milliseconds % 1000) / 10)
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  // Store finish times from FinishLineRegistration
  const finishTimesRef = useRef<Map<string, { timestamp: number; position: number }>>(new Map())

  const handleFinishTimeRecorded = useCallback((finishTime: { id: string; timestamp: number; position: number }) => {
    // Store the finish time in our ref for later retrieval
    finishTimesRef.current.set(finishTime.id, {
      timestamp: finishTime.timestamp,
      position: finishTime.position
    })
    console.log('Finish time recorded:', finishTime)
  }, [])

  const handleRunnerAssigned = useCallback(async (runnerId: number, finishTimeId: string) => {
    if (!currentRace || !setCurrentRace) return
    
    try {
      // Find the runner in currentRace
      const runnerIndex = currentRace.runners.findIndex(r => r.member_number === runnerId)
      if (runnerIndex === -1) {
        console.error(`Runner with ID ${runnerId} not found`)
        return
      }

      // Get the actual finish time from our stored times
      const finishTimeData = finishTimesRef.current.get(finishTimeId)
      if (!finishTimeData) {
        console.error(`Finish time with ID ${finishTimeId} not found`)
        return
      }

      const updatedRunners = [...currentRace.runners]
      updatedRunners[runnerIndex] = {
        ...updatedRunners[runnerIndex],
        finish_time: finishTimeData.timestamp,
        finish_position: finishTimeData.position
      }

      const updatedRace = { ...currentRace, runners: updatedRunners }
      
      // Check if all runners have finished and auto-complete race
      const checkedInRunners = updatedRace.runners.filter(r => r.checked_in)
      const areAllFinished = checkedInRunners.length > 0 &&
        checkedInRunners.every(r => r.finish_time !== undefined)

      if (areAllFinished) {
        updatedRace.status = 'finished'
        stopRace() // Stop the race timer
        setCurrentView('results')
      }
      
      await db.saveRace(updatedRace)
      setCurrentRace(updatedRace)
    } catch (error) {
      console.error('Error assigning runner:', error)
    }
  }, [currentRace, setCurrentRace, setCurrentView, stopRace])

  const handleRunnerRemoved = useCallback(async (runnerId: number) => {
    if (!currentRace || !setCurrentRace) return

    try {
      // Find and clear runner's finish time
      const runnerIndex = currentRace.runners.findIndex(r => r.member_number === runnerId)
      if (runnerIndex === -1) {
        console.error(`Runner with ID ${runnerId} not found`)
        return
      }

      const updatedRunners = [...currentRace.runners]
      updatedRunners[runnerIndex] = {
        ...updatedRunners[runnerIndex],
        finish_time: undefined,
        finish_position: undefined
      }

      const updatedRace = { ...currentRace, runners: updatedRunners }
      await db.saveRace(updatedRace)
      setCurrentRace(updatedRace)
    } catch (error) {
      console.error('Error removing runner:', error)
    }
  }, [currentRace, setCurrentRace])

  const handleAddTimekeeper = useCallback(async (runnerNumber: number) => {
    if (!currentRace || !setCurrentRace) return

    try {
      const runnerIndex = currentRace.runners.findIndex(r => r.member_number === runnerNumber)
      if (runnerIndex === -1) {
        console.error(`Runner with number ${runnerNumber} not found`)
        return
      }

      const updatedRunners = [...currentRace.runners]
      updatedRunners[runnerIndex] = {
        ...updatedRunners[runnerIndex],
        status: 'starter_timekeeper',
        finish_time: undefined,
        finish_position: undefined
      }

      const updatedRace = { ...currentRace, runners: updatedRunners }
      await db.saveRace(updatedRace)
      setCurrentRace(updatedRace)
    } catch (error) {
      console.error('Error adding timekeeper:', error)
    }
  }, [currentRace, setCurrentRace])

  const handleRemoveTimekeeper = useCallback(async (runnerNumber: number) => {
    if (!currentRace || !setCurrentRace) return

    try {
      const runnerIndex = currentRace.runners.findIndex(r => r.member_number === runnerNumber)
      if (runnerIndex === -1) {
        console.error(`Runner with number ${runnerNumber} not found`)
        return
      }

      const updatedRunners = [...currentRace.runners]
      updatedRunners[runnerIndex] = {
        ...updatedRunners[runnerIndex],
        status: undefined
      }

      const updatedRace = { ...currentRace, runners: updatedRunners }
      await db.saveRace(updatedRace)
      setCurrentRace(updatedRace)
    } catch (error) {
      console.error('Error removing timekeeper:', error)
    }
  }, [currentRace, setCurrentRace])

  // Get available runners (checked in, not finished)
  const availableRunners = useMemo(() => {
    if (!currentRace) return []
    return currentRace.runners.filter(r => r.checked_in && r.finish_time === undefined)
  }, [currentRace])

  // Get all checked-in runners for finding assigned runners
  const allCheckedInRunners = useMemo(() => {
    if (!currentRace) return []
    return currentRace.runners.filter(r => r.checked_in)
  }, [currentRace])


  if (!currentRace) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Race Director</h2>
        <p className="text-gray-600 dark:text-gray-400">
          No race configured. Please go to Setup and upload runner data.
        </p>
      </div>
    )
  }

  const checkedInCount = currentRace.runners.filter(r => r.checked_in).length
  const isActiveRaceState = isRaceRunning && currentRace.status === 'active'
  const showFocusToggle = true

  return (
    <div className={`max-w-7xl mx-auto h-full flex flex-col ${isActiveRaceState && isFocusMode ? 'gap-3' : 'gap-4'}`}>
      {/* Header adapts when race is active */}
      <div
        className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-shrink-0 ${
          isActiveRaceState
            ? 'pb-3 mb-2 border-b border-blue-200 dark:border-blue-800'
            : 'p-3 mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'
        }`}
      >
        <div className="min-w-0">
          <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm truncate">{currentRace.name}</p>
          <p className="text-xs text-blue-600 dark:text-blue-300">{checkedInCount}/{currentRace.runners.length} checked in</p>
          <WakeLockIndicator className="mt-1" />
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className={`text-xs font-semibold px-2 py-1 rounded-full tracking-wide ${
            isRaceRunning 
              ? isTestingMode 
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {isRaceRunning ? (isTestingMode ? '⚡ Testing 10x' : 'Active Race') : 'Ready'}
          </div>
          <div
            className={`timer-display font-bold tabular-nums ${
              isActiveRaceState ? 'text-2xl sm:text-3xl' : 'text-3xl'
            } text-blue-900 dark:text-blue-100`}
            aria-live="polite"
          >
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      {showFocusToggle && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
          <span className="uppercase tracking-wide font-semibold">
            {isFocusMode ? 'Focus mode enabled' : isActiveRaceState ? 'Active race controls' : 'Focus mode available once race starts'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTimekeeperModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-purple-300 px-3 py-1 text-xs sm:text-sm font-medium text-purple-700 hover:bg-purple-50 transition dark:border-purple-700 dark:text-purple-200 dark:hover:bg-purple-900/20"
            >
              ⏱️ {currentRace.runners.filter(r => r.status === 'starter_timekeeper').length}
            </button>
            <button
              type="button"
              onClick={() => setIsFocusMode((prev: boolean) => !prev)}
              disabled={!isActiveRaceState && !isFocusMode}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs sm:text-sm font-medium transition ${
                isFocusMode
                  ? 'border-yellow-400 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200'
                  : 'border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-blue-700 dark:text-blue-200'
              }`}
            >
              {isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
            </button>
          </div>
        </div>
      )}

      {/* Testing Mode Toggle - Show only when race is not running */}
      {!isRaceRunning && (
        <div className="flex justify-center mb-2 flex-shrink-0">
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={isTestingMode}
              onChange={(e) => setIsTestingMode(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="select-none">
              ⚡ 10x Speed Testing Mode
              <span className="text-xs block text-gray-500">
                (Timer runs faster for development testing)
              </span>
            </span>
          </label>
        </div>
      )}

      {/* Start Race Button - Only show when not running */}
      {!isRaceRunning && (
        <div className="flex justify-center mb-4 flex-shrink-0">
          <button
            onClick={startRace}
            className="px-6 py-2 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Start Race{isTestingMode ? ' (10x Speed)' : ''}
          </button>
        </div>
      )}

      {/* Calculate if there are upcoming starts */}
      <div className="flex-1 flex flex-col">
        {(() => {
          const checkedInRunners = currentRace.runners.filter(r => r.checked_in)
          const hasUpcomingStarts = checkedInRunners.some(runner => {
            const handicapStr = runner.distance === '5km' 
              ? runner.current_handicap_5k 
              : runner.current_handicap_10k
            if (!handicapStr) return false
            const handicapMs = timeStringToMs(handicapStr)
            const timeUntilStart = handicapMs - elapsedTime
            return timeUntilStart > -2000 // Same logic as StaggeredStartQueue
          })

          return (
            <>
              {/* Show start queue when race is running and has upcoming starts */}
              {isRaceRunning && hasUpcomingStarts && (
                <StaggeredStartQueue
                  currentRace={currentRace}
                  elapsedTime={elapsedTime}
                  audioEnabled={clubConfig.audio_enabled ?? true}
                  isActiveRace
                  isFocusMode={isFocusMode}
                />
              )}

              {/* Show finish registration when race is running but no upcoming starts */}
              {isRaceRunning && !hasUpcomingStarts && (
                <FinishLineRegistration 
                  availableRunners={availableRunners}
                  allRunners={allCheckedInRunners}
                  onFinishTimeRecorded={handleFinishTimeRecorded}
                  onRunnerAssigned={handleRunnerAssigned}
                  onRunnerRemoved={(runnerId) => handleRunnerRemoved(runnerId)}
                  isRaceRunning={isRaceRunning}
                  elapsedTime={elapsedTime}
                  onViewResults={() => {
                    setCurrentView('results')
                    // Update race status to finished
                    if (currentRace) {
                      const updatedRace = { ...currentRace, status: 'finished' as const }
                      db.saveRace(updatedRace)
                      setCurrentRace(updatedRace)
                    }
                  }}
                />
              )}

              {/* Show pre-race start overview when race is not running */}
              {!isRaceRunning && checkedInRunners.length > 0 && (
                <StaggeredStartQueue
                  currentRace={currentRace}
                  elapsedTime={0}
                  showPreRace={true}
                  audioEnabled={clubConfig.audio_enabled ?? true}
                />
              )}

              {/* Show ready state when race is not running and no runners checked in */}
              {!isRaceRunning && checkedInRunners.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Ready to Start Race
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    No runners checked in yet
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Go to Check-in to register runners
                  </p>
                </div>
              )}
            </>
          )
        })()}
      </div>

      {/* Timekeeper Management Modal */}
      <TimekeeperModal
        isOpen={isTimekeeperModalOpen}
        onClose={() => setIsTimekeeperModalOpen(false)}
        runners={currentRace.runners}
        onAddTimekeeper={handleAddTimekeeper}
        onRemoveTimekeeper={handleRemoveTimekeeper}
      />
    </div>
  )
}

export default RaceDirectorView
