import { useState, useCallback, useMemo } from 'react'
import type { Runner } from '../../types'

const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const ms = Math.floor((milliseconds % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

interface FinishTime {
  id: string
  timestamp: number
  position: number
  runnerId?: number
}

interface FinishLineRegistrationProps {
  availableRunners: Runner[]
  allRunners?: Runner[] // All checked-in runners for finding assigned runners
  onFinishTimeRecorded: (finishTime: FinishTime) => void
  onRunnerAssigned: (runnerId: number, finishTimeId: string) => void
  onRunnerRemoved: (runnerId: number, finishTimeId: string) => void
  isRaceRunning: boolean
  elapsedTime: number
  onViewResults?: () => void
}

interface TappableRunnerProps {
  runner: Runner
  isSelected: boolean
  onSelect: () => void
}

interface TappableFinishSlotProps {
  finishTime: FinishTime
  assignedRunner?: Runner
  position: number
  isAvailable: boolean
  onAssignRunner: () => void
  onRemoveRunner: () => void
  onDeleteSlot: () => void
  onSwapPosition: () => void
}

function TappableRunner({ runner, isSelected, onSelect }: TappableRunnerProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full px-4 py-3 rounded-lg font-bold text-lg text-left
        transition-all duration-200 touch-manipulation
        shadow-md hover:shadow-lg min-h-[60px]
        ${
          isSelected
            ? 'bg-orange-500 text-white ring-4 ring-orange-300 ring-opacity-75 transform scale-105'
            : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
        }
      `}
    >
      #{runner.member_number}
      <div className="text-sm opacity-90 font-normal">
        {runner.full_name.split(' ')[0]} {runner.full_name.split(' ').slice(-1)[0]}
      </div>
    </button>
  )
}

function TappableFinishSlot({ 
  finishTime, 
  assignedRunner, 
  position,
  isAvailable,
  onAssignRunner,
  onRemoveRunner,
  onDeleteSlot,
  onSwapPosition
}: TappableFinishSlotProps) {

  return (
    <div
      className={`
        border-2 rounded-lg p-4 min-h-[80px] flex flex-col justify-center
        transition-all duration-200
        ${
          assignedRunner
            ? 'bg-green-100 dark:bg-green-900/20 border-green-400'
            : isAvailable
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 border-dashed cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 border-dashed'
        }
      `}
      onClick={isAvailable && !assignedRunner ? onAssignRunner : undefined}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Position #{position}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(finishTime.timestamp)}
          </div>
        </div>
        
        {assignedRunner && (
          <div className="flex items-center gap-2">
            <div 
              className="bg-green-500 text-white px-3 py-1 rounded font-bold cursor-pointer hover:bg-green-600 flex-1"
              onClick={onSwapPosition}
              title="Tap to swap with another position"
            >
              #{assignedRunner.member_number}
              <div className="text-xs opacity-90">
                {assignedRunner.full_name.split(' ')[0]} {assignedRunner.full_name.split(' ').slice(-1)[0]}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemoveRunner()
              }}
              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              type="button"
              title="Remove runner from this position"
            >
              ✕
            </button>
          </div>
        )}
        
        {!assignedRunner && (
          <div className="flex items-center justify-between w-full">
            <div className={`text-sm ${
              isAvailable ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {isAvailable ? 'Tap to assign selected runner' : 'Select a runner first'}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteSlot()
              }}
              className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              type="button"
              title="Delete this finish time slot"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FinishLineRegistration({
  availableRunners,
  allRunners,
  onFinishTimeRecorded,
  onRunnerAssigned,
  onRunnerRemoved,
  isRaceRunning,
  elapsedTime,
  onViewResults
}: FinishLineRegistrationProps) {
  const [finishTimes, setFinishTimes] = useState<FinishTime[]>([])
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null)
  const [isButtonPressed, setIsButtonPressed] = useState(false)
  const [swappingPosition, setSwappingPosition] = useState<string | null>(null)

  const playBeep = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.debug('Audio feedback not available:', error)
    }
  }, [])

  const vibrate = useCallback(() => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } catch (error) {
      console.debug('Vibration feedback not available:', error)
    }
  }, [])

  const handleRunnerSelect = useCallback((runner: Runner) => {
    if (selectedRunner?.member_number === runner.member_number) {
      setSelectedRunner(null)
    } else {
      setSelectedRunner(runner)
      vibrate()
    }
  }, [selectedRunner, vibrate])

  const handlePositionAssign = useCallback((finishTimeId: string) => {
    if (!selectedRunner) return
    
    const runnerId = selectedRunner.member_number
    const previousState = finishTimes
    
    setFinishTimes(prev => prev.map(ft => 
      ft.id === finishTimeId ? { ...ft, runnerId } : ft
    ))
    
    setSelectedRunner(null)
    vibrate()
    playBeep()
    
    try {
      onRunnerAssigned(runnerId, finishTimeId)
    } catch (error) {
      console.error('Error assigning runner:', error)
      setFinishTimes(previousState)
      setSelectedRunner(selectedRunner)
    }
  }, [selectedRunner, finishTimes, onRunnerAssigned, vibrate, playBeep])

  const handlePositionSwap = useCallback((finishTimeId: string) => {
    if (swappingPosition === null) {
      setSwappingPosition(finishTimeId)
      vibrate()
    } else if (swappingPosition === finishTimeId) {
      setSwappingPosition(null)
    } else {
      setFinishTimes(prev => {
        const pos1 = prev.find(ft => ft.id === swappingPosition)
        const pos2 = prev.find(ft => ft.id === finishTimeId)
        if (!pos1 || !pos2) return prev
        
        return prev.map(ft => {
          if (ft.id === swappingPosition) return { ...ft, runnerId: pos2.runnerId }
          if (ft.id === finishTimeId) return { ...ft, runnerId: pos1.runnerId }
          return ft
        })
      })
      setSwappingPosition(null)
      vibrate()
      playBeep()
    }
  }, [swappingPosition, vibrate, playBeep])

  const handleFinishButtonPress = useCallback(() => {
    if (!isRaceRunning) return

    setIsButtonPressed(true)
    setTimeout(() => setIsButtonPressed(false), 150)
    vibrate()
    playBeep()

    const newFinishTime: FinishTime = {
      id: `finish-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: elapsedTime,
      position: finishTimes.length + 1
    }

    setFinishTimes(prev => [...prev, newFinishTime])
    
    try {
      onFinishTimeRecorded(newFinishTime)
    } catch (error) {
      console.error('Error recording finish time:', error)
      setFinishTimes(prev => prev.filter(ft => ft.id !== newFinishTime.id))
    }
  }, [isRaceRunning, elapsedTime, finishTimes.length, onFinishTimeRecorded, vibrate, playBeep])

  const removeRunnerFromSlot = (finishTimeId: string, runnerId: number) => {
    const previousState = finishTimes
    setFinishTimes(prev => prev.map(ft => 
      ft.id === finishTimeId ? { ...ft, runnerId: undefined } : ft
    ))
    
    try {
      onRunnerRemoved(runnerId, finishTimeId)
    } catch (error) {
      console.error('Error removing runner:', error)
      setFinishTimes(previousState)
    }
  }

  const deleteFinishSlot = (finishTimeId: string) => {
    setFinishTimes(prev => {
      const filtered = prev.filter(ft => ft.id !== finishTimeId)
      return filtered.map((ft, index) => ({ ...ft, position: index + 1 }))
    })
  }

  const assignedRunnerIds = useMemo(() => 
    new Set(finishTimes.filter(ft => ft.runnerId).map(ft => ft.runnerId)),
    [finishTimes]
  )
  
  const unassignedRunners = useMemo(() => 
    availableRunners.filter(runner => !assignedRunnerIds.has(runner.member_number)),
    [availableRunners, assignedRunnerIds]
  )

  const getAssignedRunner = useCallback((finishTime: FinishTime): Runner | undefined => {
    if (!finishTime.runnerId) return undefined
    const runnersToSearch = allRunners || availableRunners
    return runnersToSearch.find(r => r.member_number === finishTime.runnerId)
  }, [allRunners, availableRunners])

  if (!Array.isArray(availableRunners) || typeof elapsedTime !== 'number' || elapsedTime < 0) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 rounded-lg">
        <p className="text-red-800 dark:text-red-200">Error: Invalid data provided</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Finish Button */}
      <div className="lg:w-full lg:max-w-sm">
        <div className="sticky top-4">
          <button
            onClick={handleFinishButtonPress}
            disabled={!isRaceRunning}
            className={`
              w-full h-32 text-4xl font-bold rounded-xl shadow-lg
              transition-all duration-150 transform
              ${isRaceRunning 
                ? `${isButtonPressed 
                    ? 'bg-red-700 scale-95 shadow-red-700/50' 
                    : 'bg-red-500 hover:bg-red-600 active:scale-95 shadow-red-500/25'
                  } text-white` 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
              ${isButtonPressed ? 'ring-4 ring-red-300 ring-opacity-75' : ''}
              touch-manipulation select-none
            `}
          >
            {isButtonPressed ? '✓ RECORDED!' : 'FINISH!'}
          </button>
          
          {isRaceRunning && (
            <div className="mt-4 text-center">
              <div className="text-2xl font-mono font-bold">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Race Time
              </div>
            </div>
          )}
          
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            {finishTimes.length} finish times recorded
          </div>
        </div>
      </div>

      {/* Tap-based Interface */}
      <div className="flex-1 flex gap-6">
        {/* Available Runners */}
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-300">
            Available Runners ({unassignedRunners.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {unassignedRunners.map((runner) => (
              <TappableRunner 
                key={runner.member_number} 
                runner={runner}
                isSelected={selectedRunner?.member_number === runner.member_number}
                onSelect={() => handleRunnerSelect(runner)}
              />
            ))}
          </div>
          
          {unassignedRunners.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              All runners have been assigned positions
            </div>
          )}
        </div>

        {/* Finish Times */}
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-300">
            Finish Order ({finishTimes.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {finishTimes.slice().reverse().map((finishTime) => (
              <TappableFinishSlot
                key={finishTime.id}
                finishTime={finishTime}
                assignedRunner={getAssignedRunner(finishTime)}
                position={finishTime.position}
                isAvailable={selectedRunner !== null && !getAssignedRunner(finishTime)}
                onAssignRunner={() => handlePositionAssign(finishTime.id)}
                onRemoveRunner={() => finishTime.runnerId && removeRunnerFromSlot(finishTime.id, finishTime.runnerId)}
                onDeleteSlot={() => deleteFinishSlot(finishTime.id)}
                onSwapPosition={() => handlePositionSwap(finishTime.id)}
              />
            ))}
          </div>
          
          {finishTimes.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Press FINISH! to record finish times
            </div>
          )}
        </div>
      </div>
      
      {/* View Results Button - Show when all runners are finished */}
      {unassignedRunners.length === 0 && finishTimes.length > 0 && onViewResults && (
        <div className="mt-6 text-center">
          <button
            onClick={onViewResults}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg"
          >
            🏆 View Results & Calculate Handicaps
          </button>
        </div>
      )}
    </div>
  )
}