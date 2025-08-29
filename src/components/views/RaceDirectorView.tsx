import type { Race, Runner, AppView } from '../../types'
import { timeStringToMs } from '../../raceLogic'
import { db } from '../../db'
import StaggeredStartQueue from '../race/StaggeredStartQueue'
import RunnerNumberGrid from '../race/RunnerNumberGrid'

interface RaceDirectorViewProps {
  currentRace: Race | null
  isRaceRunning: boolean
  elapsedTime: number
  startRace: () => void
  recordFinishTime: (runner: Runner) => void
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
  recordFinishTime, 
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
              {/* Staggered Start Queue - Show when race is running and has upcoming starts */}
              {isRaceRunning && hasUpcomingStarts && (
                <StaggeredStartQueue 
                  currentRace={currentRace}
                  elapsedTime={elapsedTime}
                />
              )}

              {/* Runner Number Grid - Show finish section only when no upcoming starts */}
              <RunnerNumberGrid 
                currentRace={currentRace} 
                isRaceRunning={isRaceRunning}
                showFinishSection={!hasUpcomingStarts}
                onRecordFinishTime={recordFinishTime}
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
            </>
          )
        })()}
      </div>
    </div>
  )
}

export default RaceDirectorView