import { useState } from 'react'
import type { Race, Runner, RunnerStatus } from '../../types'
import { db } from '../../db'
import { getChampionshipPoints, parseChampionshipRaceHistory } from '../../raceLogic'

interface ResultsTableProps {
  currentRace: Race
  setCurrentRace: (race: Race) => void
  editingRunnerTime: {runnerId: number, currentTime: string} | null
  setEditingRunnerTime: (editing: {runnerId: number, currentTime: string} | null) => void
  handleTimeAdjustment: (runnerId: number, newTime: string) => void
}

export default function ResultsTable({ 
  currentRace, 
  setCurrentRace,
  editingRunnerTime, 
  setEditingRunnerTime, 
  handleTimeAdjustment 
}: ResultsTableProps) {
  const [filterDistance, setFilterDistance] = useState<'all' | '5km' | '10km'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [inputTime, setInputTime] = useState('')

  // Include all processed runners (finished, DNF, Early Start)
  const processedRunners = currentRace.runners.filter(r =>
    r.finish_time !== undefined || r.status === 'dnf' || r.status === 'early_start'
  )

  const filteredRunners = processedRunners.filter(r =>
    (filterDistance === 'all' || r.distance === filterDistance) &&
    (searchQuery === '' || r.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Get official position list to assign unofficial runners positions for display
  const getDisplayPosition = (runner: Runner): number | null => {
    if (runner.finish_position) {
      return runner.finish_position // Official position
    }
    if (runner.finish_time !== undefined && runner.status !== 'dnf' && runner.status !== 'early_start') {
      // Unofficial runner - find their position among all finishers of same distance
      const sameDistanceFinishers = filteredRunners.filter(r =>
        r.distance === runner.distance &&
        r.finish_time !== undefined &&
        r.status !== 'dnf' &&
        r.status !== 'early_start'
      ).sort((a, b) => a.finish_time! - b.finish_time!)

      const displayPos = sameDistanceFinishers.findIndex(r => r.member_number === runner.member_number) + 1
      return displayPos > 0 ? displayPos : null
    }
    return null
  }

  // Sort: finished runners by position first, then DNF/Early Start at end
  const sortedRunners = [...filteredRunners].sort((a, b) => {
    if (a.finish_position && b.finish_position) {
      return a.finish_position - b.finish_position
    }
    if (a.finish_position && !b.finish_position) return -1
    if (!a.finish_position && b.finish_position) return 1
    // Both DNF/Early Start or both unofficial - sort by finish time, then member number
    if (a.finish_time !== undefined && b.finish_time !== undefined) {
      return a.finish_time - b.finish_time
    }
    return a.member_number - b.member_number
  })

  const formatTime = (ms: number): string => {
    const totalSeconds = ms / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = (totalSeconds % 60).toFixed(1)
    return `${minutes}:${seconds.padStart(4, '0')}`
  }

  const startEdit = (runner: Runner) => {
    const timeStr = formatTime(runner.finish_time!)
    setEditingRunnerTime({ runnerId: runner.member_number, currentTime: timeStr })
    setInputTime(timeStr)
  }

  const saveEdit = () => {
    if (editingRunnerTime) {
      handleTimeAdjustment(editingRunnerTime.runnerId, inputTime)
    }
  }

  const cancelEdit = () => {
    setEditingRunnerTime(null)
    setInputTime('')
  }

  const handleStatusChange = async (runner: Runner, status: RunnerStatus) => {
    const updatedRunners = currentRace.runners.map(r =>
      r.member_number === runner.member_number
        ? { ...r, status, finish_time: status === 'dnf' || status === 'early_start' ? undefined : r.finish_time, finish_position: status === 'dnf' || status === 'early_start' ? undefined : r.finish_position }
        : r
    )

    const updatedRace = { ...currentRace, runners: updatedRunners }
    await db.saveRace(updatedRace)
    setCurrentRace(updatedRace)
    setEditingRunnerTime(null)
  }

  const getRaceCount = (runner: Runner): number => {
    const history = runner.distance === '5km'
      ? runner.championship_races_5k
      : runner.championship_races_10k
    return history ? parseChampionshipRaceHistory(history).length : 0
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">Results</h3>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Distance Filter */}
        <select 
          value={filterDistance}
          onChange={(e) => setFilterDistance(e.target.value as '5km' | '10km' | 'all')}
          className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
        >
          <option value="all">All Distances</option>
          <option value="5km">5K Only</option>
          <option value="10km">10K Only</option>
        </select>
        
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search runners..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-sm"
        />
      </div>

      {/* Results Counter */}
      {filteredRunners.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Showing {filteredRunners.length} of {processedRunners.length} processed runners
        </div>
      )}

      {/* Responsive Card Layout */}
      <div className="space-y-4">
        {sortedRunners.map((runner) => {
          const isEditing = editingRunnerTime?.runnerId === runner.member_number
          const oldHandicap = runner.distance === '5km' ? runner.current_handicap_5k : runner.current_handicap_10k
          
          return (
            <div key={runner.member_number} 
                 className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow ${isEditing ? 'ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
              
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                  <div className="text-2xl font-bold flex items-center gap-0.5 sm:gap-1">
                    {runner.finish_position === 1 && '🥇'}
                    {runner.finish_position === 2 && '🥈'}
                    {runner.finish_position === 3 && '🥉'}
                    {runner.status === 'dnf' && '❌'}
                    {runner.status === 'early_start' && '⚠️'}
                    <span className="text-lg sm:text-xl">
                      {runner.finish_position ? runner.finish_position : (runner.status === 'dnf' ? 'DNF' : runner.status === 'early_start' ? 'Early Start' : getDisplayPosition(runner) || '-')}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    #{runner.member_number}
                  </div>
                  <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium ${
                    runner.distance === '5km'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                  }`}>
                    {runner.distance}
                  </span>
                  
                  {/* Status badge */}
                  {runner.status && (
                    <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium ${
                      runner.status === 'dnf'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                        : runner.status === 'early_start'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                        : ''
                    }`}>
                      {runner.status === 'dnf' ? 'DNF' : runner.status === 'early_start' ? <span><span className="hidden sm:inline">Early </span>Start</span> : ''}
                    </span>
                  )}

                  {/* Unofficial badge */}
                  {(() => {
                    const isOfficial = runner.distance === '5km' ? runner.is_official_5k : runner.is_official_10k
                    if (isOfficial !== false || runner.status === 'dnf' || runner.status === 'early_start') return null
                    return (
                      <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                        UO
                      </span>
                    )
                  })()}

                  {/* Championship points badge (if official runner) */}
                  {(() => {
                    const isOfficial = runner.distance === '5km' ? runner.is_official_5k : runner.is_official_10k
                    if (!isOfficial || !runner.finish_position) return null
                    const pointsEarned = getChampionshipPoints(runner.finish_position ?? null, runner.status)
                    return (
                      <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium ${
                        pointsEarned >= 15
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          : pointsEarned >= 8
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                      }`}>
                        <span className="hidden sm:inline">Points: </span>{pointsEarned}<span className="sm:hidden"> pts</span>
                      </span>
                    )
                  })()}
                </div>
                
                <div className="w-full sm:w-auto">
                  {!isEditing && (
                    <div className="flex gap-2 w-full sm:w-auto sm:justify-end">
                      {runner.finish_time !== undefined && (
                        <button
                          onClick={() => startEdit(runner)}
                          className="flex-1 sm:flex-initial px-2 sm:px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 whitespace-nowrap"
                          title="Edit finish time"
                        >
                          <span className="hidden sm:inline">Edit </span>✏️
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(runner, 'dnf')}
                        className="flex-1 sm:flex-initial px-2 sm:px-3 py-1 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700"
                        title="Mark as DNF"
                      >
                        DNF
                      </button>
                      <button
                        onClick={() => handleStatusChange(runner, 'early_start')}
                        className="flex-1 sm:flex-initial px-2 sm:px-3 py-1 bg-yellow-600 text-white rounded text-xs sm:text-sm hover:bg-yellow-700 whitespace-nowrap"
                        title="Mark as Early Start"
                      >
                        <span className="hidden sm:inline">Early </span>⚠️
                      </button>
                    </div>
                  )}
                  {isEditing && (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={saveEdit}
                        className="flex-1 px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700"
                      >
                        <span className="hidden sm:inline">Save </span>✓
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-2 sm:px-3 py-1 bg-gray-600 text-white rounded text-xs sm:text-sm hover:bg-gray-700"
                      >
                        <span className="hidden sm:inline">Cancel </span>✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Runner Name */}
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {runner.full_name}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {runner.status === 'dnf' ? 'Status' : runner.status === 'early_start' ? 'Status' : 'Finish Time'}
                  </div>
                  <div className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400">
                    {runner.status === 'dnf' ? (
                      <span className="text-red-600 dark:text-red-400">DNF</span>
                    ) : runner.status === 'early_start' ? (
                      <span className="text-yellow-600 dark:text-yellow-400">Early Start</span>
                    ) : isEditing ? (
                      <input
                        type="text"
                        value={inputTime}
                        onChange={(e) => setInputTime(e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm text-center dark:bg-gray-700 dark:border-gray-600 font-mono"
                        placeholder="MM:SS.s"
                        autoFocus
                      />
                    ) : (
                      formatTime(runner.finish_time!)
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Old Handicap</div>
                  <div className="font-mono text-gray-600 dark:text-gray-400 font-medium text-lg">
                    {oldHandicap || 'N/A'}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">New Handicap</div>
                  <div className="font-mono font-semibold text-green-600 dark:text-green-400 text-lg">
                    {runner.new_handicap}
                  </div>
                </div>

                {/* Championship Season Total Card */}
                {(() => {
                  const isOfficial = runner.distance === '5km' ? runner.is_official_5k : runner.is_official_10k
                  if (!isOfficial) return null

                  const seasonTotal = runner.distance === '5km' ? runner.championship_points_5k || 0 : runner.championship_points_10k || 0
                  const raceCount = getRaceCount(runner)

                  return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Season Total</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {seasonTotal}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {raceCount} race{raceCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )
        })}
        
        {filteredRunners.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">🏃‍♂️</div>
            <div className="text-lg">No finishers found for selected filters</div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <strong>📝 Time Adjustment Instructions:</strong>
        <ul className="mt-2 space-y-1 text-xs">
          <li>• Click "Edit" to modify a finish time</li>
          <li>• Use MM:SS.s format (e.g., 25:34.5 for 25 minutes 34.5 seconds)</li>
          <li>• Results and handicaps automatically recalculate when saved</li>
          <li>• This corrects recording errors during the race</li>
        </ul>
      </div>
    </div>
  )
}