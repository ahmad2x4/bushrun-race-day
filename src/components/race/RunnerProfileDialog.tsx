import { useMemo, useState } from 'react'
import type { Runner } from '../../types'
import Modal from '../ui/Modal'
import { parseChampionshipRaceHistory, identifyBest8Races } from '../../raceLogic'

interface RunnerProfileDialogProps {
  runner: Runner | null
  isOpen: boolean
  onClose: () => void
}

function RunnerProfileDialog({ runner, isOpen, onClose }: RunnerProfileDialogProps) {
  const [activeDistance, setActiveDistance] = useState<'5km' | '10km'>('5km')

  // Get race history for active distance
  const raceHistory = useMemo(() => {
    if (!runner) return []
    const history = activeDistance === '5km' ? runner.championship_races_5k : runner.championship_races_10k
    if (!history) return []
    return parseChampionshipRaceHistory(history)
  }, [runner, activeDistance])

  // Identify best 8 races
  const best8Months = useMemo(() => {
    if (!runner || !raceHistory.length) return new Set<number>()
    const history = activeDistance === '5km' ? runner.championship_races_5k : runner.championship_races_10k
    if (!history) return new Set<number>()
    return identifyBest8Races(history)
  }, [runner, activeDistance, raceHistory])

  // Get championship points and race count
  const stats = useMemo(() => {
    if (!runner) return { points: 0, count: 0 }
    if (activeDistance === '5km') {
      return {
        points: runner.championship_points_5k || 0,
        count: raceHistory.length,
        isOfficial: runner.is_official_5k,
      }
    } else {
      return {
        points: runner.championship_points_10k || 0,
        count: raceHistory.length,
        isOfficial: runner.is_official_10k,
      }
    }
  }, [runner, activeDistance, raceHistory])

  // Format month name
  const formatMonth = (month: number): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1] || 'Unknown'
  }

  // Format position badge
  const formatPosition = (position: string): string => {
    if (position === 'DNF') return 'DNF'
    if (position === 'ES') return 'ES'
    if (position === 'ST') return 'ST'
    const num = parseInt(position)
    if (num === 1) return '1st'
    if (num === 2) return '2nd'
    if (num === 3) return '3rd'
    return `${num}th`
  }

  if (!runner) {
    return null
  }

  const handicapKey = activeDistance === '5km' ? 'current_handicap_5k' : 'current_handicap_10k'
  const currentHandicap = runner[handicapKey] || 'N/A'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${runner.full_name}'s Championship Profile`}>
      <div className="space-y-6">
        {/* Runner Info */}
        <div className="border-b dark:border-gray-700 pb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold">{runner.full_name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">#{runner.member_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Official Status</p>
              <p className={`text-sm font-bold ${stats.isOfficial ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.isOfficial ? 'Official' : 'Provisional'}
              </p>
            </div>
          </div>
        </div>

        {/* Distance Tabs */}
        {(runner.championship_races_5k || runner.championship_races_10k) && (
          <div className="flex gap-2 border-b dark:border-gray-700">
            <button
              onClick={() => setActiveDistance('5km')}
              className={`px-3 py-2 font-medium border-b-2 transition-colors ${
                activeDistance === '5km'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              5km
            </button>
            <button
              onClick={() => setActiveDistance('10km')}
              className={`px-3 py-2 font-medium border-b-2 transition-colors ${
                activeDistance === '10km'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              10km
            </button>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Points</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.points}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Races</p>
            <p className="text-2xl font-bold">{stats.count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">of 10</p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Handicap</p>
          <p className="text-lg font-mono font-bold">{currentHandicap}</p>
        </div>

        {/* Race History */}
        {raceHistory.length > 0 ? (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span>Race History</span>
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded">
                Best 8 Highlighted
              </span>
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {raceHistory.map((race) => {
                const isBest8 = best8Months.has(race.month)
                const positionStr = race.position === 'DNF' ? 'DNF' : race.position === 'ES' ? 'ES' : race.position === 'ST' ? 'ST' : race.position
                const medalEmoji = positionStr === '1' ? '🥇' : positionStr === '2' ? '🥈' : positionStr === '3' ? '🥉' : ''

                return (
                  <div
                    key={race.month}
                    className={`p-3 rounded border dark:border-gray-600 ${
                      isBest8
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold w-8">{medalEmoji}</span>
                        <div>
                          <p className="font-medium">{formatMonth(race.month)}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Position: {formatPosition(positionStr)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{race.points} pts</p>
                        {race.time > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {Math.floor(race.time / 60)}:{(race.time % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">No race history for this distance</p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

export default RunnerProfileDialog
