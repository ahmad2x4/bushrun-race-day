import { useState } from 'react'
import type { Race } from '../../types'

interface RunnerNumberGridProps {
  currentRace: Race
  onViewResults?: () => void
}

function RunnerNumberGrid({ currentRace, onViewResults }: RunnerNumberGridProps) {
  const [selectedDistance, setSelectedDistance] = useState<'all' | '5km' | '10km'>('all')
  
  const checkedInRunners = currentRace.runners.filter(r => r.checked_in)
  const filteredRunners = selectedDistance === 'all' 
    ? checkedInRunners
    : checkedInRunners.filter(r => r.distance === selectedDistance)

  const runners5k = checkedInRunners.filter(r => r.distance === '5km')
  const runners10k = checkedInRunners.filter(r => r.distance === '10km')
  const processedRunners = checkedInRunners.filter(r => r.finish_time || r.status === 'dnf' || r.status === 'early_start')
  const allRunnersProcessed = checkedInRunners.length > 0 && processedRunners.length === checkedInRunners.length

  return (
    <div>
      {/* Compact Filter Tabs */}
      <div className="flex gap-1 mb-3 justify-center">
            <button
              onClick={() => setSelectedDistance('all')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedDistance === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              All ({filteredRunners.length})
            </button>
            <button
              onClick={() => setSelectedDistance('5km')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedDistance === '5km'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              5K ({runners5k.length})
            </button>
            <button
              onClick={() => setSelectedDistance('10km')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedDistance === '10km'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              10K ({runners10k.length})
            </button>
          </div>

          {/* Finish Progress */}
          <div className="text-center mb-3 text-sm text-gray-600 dark:text-gray-400">
            {processedRunners.length} of {filteredRunners.length} completed
          </div>

          {/* All Processed - Show Results Button */}
          {allRunnersProcessed ? (
            <div className="flex flex-col items-center space-y-4 py-8">
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                  🏁 All Runners Finished!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  All {checkedInRunners.length} checked-in runners have completed the race.
                </p>
              </div>
              <button
                onClick={onViewResults}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg"
              >
                🏆 View Results & Calculate Handicaps
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {filteredRunners
                .sort((a, b) => a.member_number - b.member_number)
                .map((runner) => {
                  const getButtonStyle = () => {
                    if (runner.status === 'dnf') {
                      return 'bg-red-500 text-white border-red-600'
                    } else if (runner.status === 'early_start') {
                      return 'bg-yellow-500 text-white border-yellow-600'
                    } else if (runner.finish_time !== undefined) {
                      return 'bg-green-500 text-white border-green-600'
                    } else {
                      return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600'
                    }
                  }
                  
                  const getButtonTitle = () => {
                    let title = `${runner.full_name} - ${runner.distance}`
                    if (runner.status === 'dnf') title += ' (DNF)'
                    else if (runner.status === 'early_start') title += ' (Early Start)'
                    else if (runner.finish_time !== undefined) title += ' (Finished)'
                    return title
                  }
                  
                  return (
                    <div
                      key={runner.member_number}
                      className={`
                        aspect-square rounded-lg font-bold text-lg border-2 shadow-lg flex items-center justify-center
                        ${getButtonStyle()}
                      `}
                      title={getButtonTitle()}
                    >
                      {runner.member_number}
                    </div>
                  )
                })}
            </div>
          )}

          {filteredRunners.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No runners checked in for this distance.
            </div>
          )}
    </div>
  )
}

export default RunnerNumberGrid