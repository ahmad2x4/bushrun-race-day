import { useState } from 'react'
import type { Race, RaceResults } from '../../types'
import { calculateHandicaps, generateResults } from '../../raceLogic'
import { db } from '../../db'
import PodiumDisplay from '../race/PodiumDisplay'
import ResultsTable from '../race/ResultsTable'
import ExportSection from '../race/ExportSection'
import { ChampionshipLeaderboard } from '../race/ChampionshipLeaderboard'

interface ResultsViewProps {
  currentRace: Race | null
  setCurrentRace: (race: Race | null) => void
}

function ResultsView({ currentRace, setCurrentRace }: ResultsViewProps) {
  const [calculatedResults, setCalculatedResults] = useState<{fiveKm: RaceResults, tenKm: RaceResults} | null>(null)
  const [showCalculateHandicapsBtn, setShowCalculateHandicapsBtn] = useState(true)
  const [editingRunnerTime, setEditingRunnerTime] = useState<{runnerId: number, currentTime: string} | null>(null)

  if (!currentRace) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Race Results</h2>
        <p className="text-gray-600 dark:text-gray-400">
          No race data available. Please complete a race first.
        </p>
      </div>
    )
  }

  const finishedRunners = currentRace.runners.filter(r => r.finish_time !== undefined)
  const totalRunners = currentRace.runners.filter(r => r.checked_in).length

  const handleCalculateHandicaps = async () => {
    if (!currentRace) return

    // Extract race month from race date (1-12)
    const raceMonth = new Date(currentRace.date).getMonth() + 1

    // Calculate new handicaps with championship support
    const runnersWithNewHandicaps = calculateHandicaps(currentRace.runners, raceMonth)
    
    // Generate results
    const results = generateResults(runnersWithNewHandicaps)
    
    // Update race status and runners
    const updatedRace = { 
      ...currentRace, 
      runners: runnersWithNewHandicaps,
      status: 'finished' as const
    }
    
    // Save to database
    await db.saveRace(updatedRace)
    setCurrentRace(updatedRace)
    setCalculatedResults(results)
    setShowCalculateHandicapsBtn(false)
  }

  const handleTimeAdjustment = async (runnerId: number, newTimeStr: string) => {
    if (!currentRace) return

    // Parse the time string (MM:SS.ss format)
    const timePattern = /^(\d{1,2}):(\d{2})\.(\d{1,2})$/
    const match = newTimeStr.match(timePattern)
    
    if (!match) {
      alert('Invalid time format. Please use MM:SS.ss (e.g., 25:34.5)')
      return
    }

    const minutes = parseInt(match[1])
    const seconds = parseInt(match[2]) 
    const centiseconds = parseInt(match[3].padEnd(2, '0'))
    
    if (seconds >= 60 || centiseconds >= 100) {
      alert('Invalid time values. Seconds must be 0-59, centiseconds 0-99')
      return
    }

    const newTimeMs = (minutes * 60 + seconds) * 1000 + centiseconds * 10

    // Find and update the runner
    const updatedRunners = currentRace.runners.map(runner => {
      if (runner.member_number === runnerId) {
        return { ...runner, finish_time: newTimeMs }
      }
      return runner
    })

    // Extract race month for championship updates
    const raceMonth = new Date(currentRace.date).getMonth() + 1

    // Recalculate handicaps and positions with championship support
    const runnersWithNewHandicaps = calculateHandicaps(updatedRunners, raceMonth)
    
    // Update race
    const updatedRace = { 
      ...currentRace, 
      runners: runnersWithNewHandicaps
    }
    
    // Save to database
    await db.saveRace(updatedRace)
    setCurrentRace(updatedRace)
    setEditingRunnerTime(null)

    // If race was finished, regenerate results
    if (currentRace.status === 'finished') {
      const results = generateResults(runnersWithNewHandicaps)
      setCalculatedResults(results)
    }
  }

  const fiveKmFinishers = finishedRunners.filter(r => r.distance === '5km').length
  const tenKmFinishers = finishedRunners.filter(r => r.distance === '10km').length

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">Race Results</h2>
        <h3 className="text-xl text-gray-600 dark:text-gray-400">{currentRace.name}</h3>
        
        {/* Race Status */}
        <div className="mt-4 flex justify-center">
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            currentRace.status === 'finished' 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
          }`}>
            Status: {currentRace.status === 'finished' ? 'Complete' : 'In Progress'}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalRunners}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Participants</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{finishedRunners.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Finishers</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{fiveKmFinishers}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">5K Finishers</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{tenKmFinishers}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">10K Finishers</div>
        </div>
      </div>

      {/* Calculate Handicaps Button */}
      {showCalculateHandicapsBtn && finishedRunners.length > 0 && (
        <div className="text-center mb-6">
          <button
            onClick={handleCalculateHandicaps}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Calculate Final Results & New Handicaps
          </button>
          <p className="text-sm text-gray-500 mt-2">
            This will calculate positions and new handicaps for next race
          </p>
        </div>
      )}

      {/* Results Display */}
      {(calculatedResults || currentRace.status === 'finished') && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 5K Results */}
            <PodiumDisplay 
              title="5K Results"
              runners={currentRace.runners.filter(r => r.distance === '5km' && r.finish_time !== undefined)}
              color="blue"
            />
            
            {/* 10K Results */}
            <PodiumDisplay 
              title="10K Results" 
              runners={currentRace.runners.filter(r => r.distance === '10km' && r.finish_time !== undefined)}
              color="purple"
            />
          </div>

          {/* Comprehensive Results Table */}
          <ResultsTable
            currentRace={currentRace}
            setCurrentRace={setCurrentRace}
            editingRunnerTime={editingRunnerTime}
            setEditingRunnerTime={setEditingRunnerTime}
            handleTimeAdjustment={handleTimeAdjustment}
          />

          {/* Championship Leaderboards */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Championship Standings</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChampionshipLeaderboard
                runners={currentRace.runners}
                distance="5km"
                color="blue"
              />
              <ChampionshipLeaderboard
                runners={currentRace.runners}
                distance="10km"
                color="purple"
              />
            </div>
          </div>

          {/* Export Section */}
          <ExportSection currentRace={currentRace} />
        </>
      )}

      {finishedRunners.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏃‍♂️</div>
          <h3 className="text-xl font-semibold mb-2">Race In Progress</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Results will appear here as runners finish. Go to Race Director to record finish times.
          </p>
        </div>
      )}
    </div>
  )
}

export default ResultsView