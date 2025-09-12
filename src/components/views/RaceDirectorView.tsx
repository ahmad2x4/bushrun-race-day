import { useCallback, useMemo, useRef } from 'react'
import type { Race, AppView } from '../../types'
import { timeStringToMs } from '../../raceLogic'
import { db } from '../../db'
import StaggeredStartQueue from '../race/StaggeredStartQueue'
import FinishLineRegistration from '../race/FinishLineRegistration'

interface RaceDirectorViewProps {
  currentRace: Race | null
  isRaceRunning: boolean
  elapsedTime: number
  startRace: () => void
  isTestingMode: boolean
  setIsTestingMode: (mode: boolean) => void
  setCurrentView: (view: AppView) => void
  setCurrentRace: (race: Race | null) => void
}

function RaceDirectorView({ 
  currentRace, 
  isRaceRunning, 
  elapsedTime, 
  startRace, 
 
  isTestingMode, 
  setIsTestingMode,
  setCurrentView,
  setCurrentRace
}: RaceDirectorViewProps) {
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
        setCurrentView('results')
      }
      
      await db.saveRace(updatedRace)
      setCurrentRace(updatedRace)
    } catch (error) {
      console.error('Error assigning runner:', error)
    }
  }, [currentRace, setCurrentRace, setCurrentView])

  const handleRunnerRemoved = useCallback(async (runnerId: number, _finishTimeId: string) => {
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

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      {/* Compact Header */}
      <div className="flex justify-between items-center p-2 mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex-shrink-0">
        <div>
          <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm">{currentRace.name}</p>
          <p className="text-xs text-blue-600 dark:text-blue-300">{checkedInCount}/{currentRace.runners.length} checked in</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
            isRaceRunning 
              ? isTestingMode 
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {isRaceRunning ? (isTestingMode ? '⚡ Testing 10x' : 'Running') : 'Ready'}
          </div>
          <div className="timer-display text-2xl font-bold tabular-nums text-blue-900 dark:text-blue-100">
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

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
                />
              )}

              {/* Show finish registration when race is running but no upcoming starts */}
              {isRaceRunning && !hasUpcomingStarts && (
                <FinishLineRegistration 
                  availableRunners={availableRunners}
                  allRunners={allCheckedInRunners}
                  onFinishTimeRecorded={handleFinishTimeRecorded}
                  onRunnerAssigned={handleRunnerAssigned}
                  onRunnerRemoved={handleRunnerRemoved}
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

              {/* Show ready state when race is not running */}
              {!isRaceRunning && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Ready to Start Race
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {checkedInRunners.length} runners checked in and ready
                  </p>
                  {hasUpcomingStarts && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Staggered starts will begin when race is started
                    </p>
                  )}
                </div>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}

export default RaceDirectorView