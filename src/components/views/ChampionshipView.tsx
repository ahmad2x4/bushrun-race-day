import { useState } from 'react'
import type { Race, Runner } from '../../types'
import { ChampionshipLeaderboard } from '../race/ChampionshipLeaderboard'
import RunnerProfileDialog from '../race/RunnerProfileDialog'

interface ChampionshipViewProps {
  currentRace: Race | null
  setCurrentRace: (race: Race | null) => void
}

function ChampionshipView({ currentRace }: ChampionshipViewProps) {
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null)
  const [distanceFilter, setDistanceFilter] = useState<'5km' | '10km'>('5km')

  if (!currentRace) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold mb-4">Championship Standings</h2>
        <p className="text-gray-600 dark:text-gray-400">
          No race data available. Please upload a CSV file in the Setup view to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Championship Standings</h2>
        <h3 className="text-xl text-gray-600 dark:text-gray-400">{currentRace.name}</h3>
      </div>

      {/* Distance Filter Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setDistanceFilter('5km')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            distanceFilter === '5km'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          5km
        </button>
        <button
          onClick={() => setDistanceFilter('10km')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            distanceFilter === '10km'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          10km
        </button>
      </div>

      {/* Championship Leaderboards */}
      <div className="flex justify-center">
        {distanceFilter === '5km' && (
          <ChampionshipLeaderboard
            runners={currentRace.runners}
            distance="5km"
            color="blue"
            onRunnerClick={(runner) => setSelectedRunner(runner)}
          />
        )}
        {distanceFilter === '10km' && (
          <ChampionshipLeaderboard
            runners={currentRace.runners}
            distance="10km"
            color="purple"
            onRunnerClick={(runner) => setSelectedRunner(runner)}
          />
        )}
      </div>

      {/* Runner Profile Dialog */}
      <RunnerProfileDialog
        runner={selectedRunner}
        isOpen={selectedRunner !== null}
        onClose={() => setSelectedRunner(null)}
      />
    </div>
  )
}

export default ChampionshipView
