import type { Race } from '../../types'
import { generateResultsCSV, generateNextRaceCSV, downloadCSV } from '../../raceLogic'

interface ExportSectionProps {
  currentRace: Race
}

export default function ExportSection({ currentRace }: ExportSectionProps) {
  const handleExportResults = () => {
    const csvContent = generateResultsCSV(currentRace.runners)
    downloadCSV(`${currentRace.name}-results.csv`, csvContent)
  }

  const handleExportNextRace = () => {
    const csvContent = generateNextRaceCSV(currentRace.runners)
    downloadCSV(`${currentRace.name}-next-race-handicaps.csv`, csvContent)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
      <h3 className="text-xl font-bold mb-4">Export Race Data</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold mb-2">📊 Race Results</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Export complete race results with positions, times, and handicap changes
          </p>
          <button
            onClick={handleExportResults}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            Download Results CSV
          </button>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold mb-2">🏃‍♂️ Next Race Setup</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Export runner data with updated handicaps for the next race
          </p>
          <button
            onClick={handleExportNextRace}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Download Next Race CSV
          </button>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Tip:</strong> The "Next Race CSV" contains all runners with their updated handicaps, 
          ready to upload for your next race setup.
        </p>
      </div>
    </div>
  )
}