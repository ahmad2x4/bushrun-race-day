import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Runner } from '../../types'

interface FinishTime {
  id: string
  timestamp: number
  position: number
  runnerId?: number
  assignedAt?: number // When the runner was assigned to this finish time
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

interface DraggableRunnerProps {
  runner: Runner
  isOverlay?: boolean
}

interface DroppableFinishSlotProps {
  finishTime: FinishTime
  assignedRunner?: Runner
  position: number
  onRemoveRunner: () => void
  onDeleteSlot: () => void
}

function DraggableRunner({ runner, isOverlay = false }: DraggableRunnerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `runner-${runner.member_number}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-blue-500 text-white px-4 py-3 rounded-lg font-bold text-lg
        cursor-grab active:cursor-grabbing
        hover:bg-blue-600 transition-colors
        shadow-md hover:shadow-lg
        touch-manipulation
        ${isOverlay ? 'cursor-grabbing shadow-2xl' : ''}
      `}
    >
      #{runner.member_number}
      <div className="text-sm opacity-90 font-normal">
        {runner.full_name.split(' ')[0]} {runner.full_name.split(' ').slice(-1)[0]}
      </div>
    </div>
  )
}

function DroppableFinishSlot({ 
  finishTime, 
  assignedRunner, 
  position, 
  onRemoveRunner,
  onDeleteSlot
}: DroppableFinishSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `finish-${finishTime.id}`,
    data: { type: 'finish-slot', finishTime }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const formatTime = (timestamp: number) => {
    const totalSeconds = Math.floor(timestamp / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const ms = Math.floor((timestamp % 1000) / 10)
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        border-2 border-dashed border-gray-300 dark:border-gray-600
        rounded-lg p-4 min-h-[80px] flex flex-col justify-center
        ${assignedRunner ? 'bg-green-100 dark:bg-green-900/20 border-green-400' : 'bg-gray-50 dark:bg-gray-800'}
        ${isDragging ? 'opacity-50' : ''}
        transition-all duration-200
      `}
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
          <div 
            className="flex items-center gap-2 cursor-move"
            {...listeners}
          >
            <div className="bg-green-500 text-white px-3 py-1 rounded font-bold">
              #{assignedRunner.member_number}
              <div className="text-xs opacity-90">
                {assignedRunner.full_name.split(' ')[0]} {assignedRunner.full_name.split(' ').slice(-1)[0]}
              </div>
            </div>
            <button
              onClick={onRemoveRunner}
              className="text-red-500 hover:text-red-700 p-1"
              type="button"
            >
              ✕
            </button>
          </div>
        )}
        
        {!assignedRunner && (
          <div className="flex items-center justify-between w-full">
            <div className="text-gray-400 dark:text-gray-500 text-sm">
              Drop runner here
            </div>
            <button
              onClick={onDeleteSlot}
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
  const [draggedRunner, setDraggedRunner] = useState<Runner | null>(null)
  const [isButtonPressed, setIsButtonPressed] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Minimal distance for immediate response
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const formatTime = useCallback((milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const ms = Math.floor((milliseconds % 1000) / 10)
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }, [])

  // Audio feedback function
  const playBeep = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800 // Hz
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      // Silently fail if audio context isn't supported
      console.debug('Audio feedback not available:', error)
    }
  }, [])

  // Vibration feedback function
  const vibrate = useCallback(() => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(50) // 50ms vibration
      }
    } catch (error) {
      // Silently fail if vibration isn't supported
      console.debug('Vibration feedback not available:', error)
    }
  }, [])

  const handleFinishButtonPress = useCallback(() => {
    if (!isRaceRunning) return

    try {
      // Visual feedback
      setIsButtonPressed(true)
      setTimeout(() => setIsButtonPressed(false), 150)

      // Haptic and audio feedback
      vibrate()
      playBeep()

      const newFinishTime: FinishTime = {
        id: `finish-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // More unique ID
        timestamp: elapsedTime,
        position: finishTimes.length + 1
      }

      setFinishTimes(prev => [...prev, newFinishTime])
      
      // Safely call the callback with error handling
      try {
        onFinishTimeRecorded(newFinishTime)
      } catch (error) {
        console.error('Error recording finish time:', error)
        // Revert the local state if the callback fails
        setFinishTimes(prev => prev.filter(ft => ft.id !== newFinishTime.id))
      }
    } catch (error) {
      console.error('Error in handleFinishButtonPress:', error)
      setIsButtonPressed(false)
    }
  }, [isRaceRunning, elapsedTime, finishTimes.length, onFinishTimeRecorded, vibrate, playBeep])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    
    if (active.id.toString().startsWith('runner-')) {
      const runnerId = parseInt(active.id.toString().replace('runner-', ''))
      const runner = availableRunners.find(r => r.member_number === runnerId)
      setDraggedRunner(runner || null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedRunner(null)

    if (!over) return

    try {
      // Handle runner to finish slot drop
      if (active.id.toString().startsWith('runner-') && over.id.toString().startsWith('finish-')) {
        const runnerId = parseInt(active.id.toString().replace('runner-', ''))
        const finishTimeId = over.id.toString().replace('finish-', '')
        
        // Validate runner exists
        if (!availableRunners.find(r => r.member_number === runnerId)) {
          console.error(`Runner with ID ${runnerId} not found`)
          return
        }
        
        // Validate finish time exists
        if (!finishTimes.find(ft => ft.id === finishTimeId)) {
          console.error(`Finish time with ID ${finishTimeId} not found`)
          return
        }

        const previousState = finishTimes
        
        // Update the local state immediately
        setFinishTimes(prev => prev.map(ft => 
          ft.id === finishTimeId 
            ? { ...ft, runnerId, assignedAt: Date.now() } 
            : ft
        ))
        
        // Safely call the callback with error handling
        try {
          onRunnerAssigned(runnerId, finishTimeId)
        } catch (error) {
          console.error('Error in onRunnerAssigned:', error)
          // Revert state on error
          setFinishTimes(previousState)
        }
        return
      }

      // Handle finish slot reordering - only swap runner assignments, not times
      if (active.id.toString().startsWith('finish-') && over.id.toString().startsWith('finish-')) {
        const activeFinishTimeId = active.id.toString().replace('finish-', '')
        const overFinishTimeId = over.id.toString().replace('finish-', '')
        
        if (activeFinishTimeId !== overFinishTimeId) {
          setFinishTimes(prev => {
            const activeSlot = prev.find(ft => ft.id === activeFinishTimeId)
            const overSlot = prev.find(ft => ft.id === overFinishTimeId)
            
            if (!activeSlot || !overSlot) {
              console.error('Could not find slots for reordering')
              return prev
            }
            
            // Swap only the runner assignments, keep times immutable
            return prev.map(ft => {
              if (ft.id === activeFinishTimeId) {
                return { ...ft, runnerId: overSlot.runnerId, assignedAt: overSlot.runnerId ? Date.now() : undefined }
              }
              if (ft.id === overFinishTimeId) {
                return { ...ft, runnerId: activeSlot.runnerId, assignedAt: activeSlot.runnerId ? Date.now() : undefined }
              }
              return ft
            })
          })
        }
      }
    } catch (error) {
      console.error('Error in handleDragEnd:', error)
    }
  }

  const removeRunnerFromSlot = (finishTimeId: string, runnerId: number) => {
    try {
      const previousState = finishTimes
      
      // Update local state immediately
      setFinishTimes(prev => prev.map(ft => 
        ft.id === finishTimeId 
          ? { ...ft, runnerId: undefined, assignedAt: undefined } 
          : ft
      ))
      
      // Safely call the callback with error handling
      try {
        onRunnerRemoved(runnerId, finishTimeId)
      } catch (error) {
        console.error('Error in onRunnerRemoved:', error)
        // Revert state on error
        setFinishTimes(previousState)
      }
    } catch (error) {
      console.error('Error in removeRunnerFromSlot:', error)
    }
  }

  const deleteFinishSlot = (finishTimeId: string) => {
    // Remove the entire finish time slot
    setFinishTimes(prev => {
      const filtered = prev.filter(ft => ft.id !== finishTimeId)
      // Reindex positions after deletion
      return filtered.map((ft, index) => ({
        ...ft,
        position: index + 1
      }))
    })
  }

  // Memoize expensive calculations for performance
  const assignedRunnerIds = useMemo(() => 
    new Set(finishTimes.filter(ft => ft.runnerId).map(ft => ft.runnerId)),
    [finishTimes]
  )
  
  const unassignedRunners = useMemo(() => 
    availableRunners.filter(runner => !assignedRunnerIds.has(runner.member_number)),
    [availableRunners, assignedRunnerIds]
  )

  // Memoize sortable items for better performance
  const runnerSortableItems = useMemo(() => 
    unassignedRunners.map(r => `runner-${r.member_number}`),
    [unassignedRunners]
  )

  const finishTimeSortableItems = useMemo(() => 
    finishTimes.slice().reverse().map(ft => `finish-${ft.id}`),
    [finishTimes]
  )

  const getAssignedRunner = useCallback((finishTime: FinishTime): Runner | undefined => {
    if (!finishTime.runnerId) return undefined
    // Look in allRunners first, fall back to availableRunners if allRunners not provided
    const runnersToSearch = allRunners || availableRunners
    return runnersToSearch.find(r => r.member_number === finishTime.runnerId)
  }, [allRunners, availableRunners])

  // Input validation (after all hooks)
  if (!availableRunners || !Array.isArray(availableRunners)) {
    console.error('FinishLineRegistration: availableRunners must be an array')
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 rounded-lg">
        <p className="text-red-800 dark:text-red-200">Error: Invalid runner data provided</p>
      </div>
    )
  }

  if (typeof elapsedTime !== 'number' || elapsedTime < 0) {
    console.error('FinishLineRegistration: elapsedTime must be a non-negative number')
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 rounded-lg">
        <p className="text-red-800 dark:text-red-200">Error: Invalid elapsed time</p>
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

      {/* Drag and Drop Interface */}
      <div className="flex-1 flex gap-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Available Runners */}
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-300">
              Available Runners ({unassignedRunners.length})
            </h3>
            <SortableContext
              items={runnerSortableItems}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {unassignedRunners.map((runner) => (
                  <DraggableRunner 
                    key={runner.member_number} 
                    runner={runner} 
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          {/* Finish Times */}
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-300">
              Finish Order ({finishTimes.length})
            </h3>
            <SortableContext
              items={finishTimeSortableItems}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {finishTimes.slice().reverse().map((finishTime) => (
                  <DroppableFinishSlot
                    key={finishTime.id}
                    finishTime={finishTime}
                    assignedRunner={getAssignedRunner(finishTime)}
                    position={finishTime.position}
                    onRemoveRunner={() => finishTime.runnerId && removeRunnerFromSlot(finishTime.id, finishTime.runnerId)}
                    onDeleteSlot={() => deleteFinishSlot(finishTime.id)}
                  />
                ))}
              </div>
            </SortableContext>
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

          <DragOverlay 
            dropAnimation={null}
            style={{
              cursor: 'grabbing',
              transformOrigin: '0 0',
            }}
            adjustScale={false}
          >
            {draggedRunner && (
              <div style={{
                transform: 'translate(-50%, -50%)', // Center the overlay on cursor
              }}>
                <DraggableRunner runner={draggedRunner} isOverlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}