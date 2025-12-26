import type { Race } from '../../types'
import { generateResultsCSV, generateNextRaceCSV, generateSeasonRolloverCSV, downloadCSV } from '../../raceLogic'

interface ExportSectionProps {
  currentRace: Race
}

export default function ExportSection({ currentRace }: ExportSectionProps) {
  const handleExportResults = () => {
    const csvContent = generateResultsCSV(currentRace.runners)
    downloadCSV(`${currentRace.name}-results.csv`, csvContent)
  }

  const handleExportNextRace = () => {
    // Debug: Check championship data before export
    const runnersWithChampionship = currentRace.runners.filter(r =>
      (r.distance === '5km' && (r.championship_points_5k || r.championship_races_5k)) ||
      (r.distance === '10km' && (r.championship_points_10k || r.championship_races_10k))
    );
    console.log(`[Export] Generating Next Race CSV for "${currentRace.name}"`);
    console.log(`[Export] Total runners: ${currentRace.runners.length}`);
    console.log(`[Export] Runners with championship data: ${runnersWithChampionship.length}`);
    if (runnersWithChampionship.length === 0) {
      console.warn('[Export] ⚠️  No runners have championship data! Did you calculate handicaps?');
      currentRace.runners.slice(0, 3).forEach(r => {
        console.log(`  - ${r.full_name} (${r.distance}): ` +
          `points_5k=${r.championship_points_5k || 'undefined'}, ` +
          `points_10k=${r.championship_points_10k || 'undefined'}`);
      });
    }

    const csvContent = generateNextRaceCSV(currentRace.runners)
    downloadCSV(`${currentRace.name}-next-race-handicaps.csv`, csvContent)
  }

  const handleSeasonRollover = () => {
    const csvContent = generateSeasonRolloverCSV(currentRace.runners)
    const nextYear = new Date().getFullYear() + 1
    downloadCSV(`bbr-runners-${nextYear}-season-start.csv`, csvContent)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
      <h3 className="text-xl font-bold mb-4">Export Race Data</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="border border-orange-200 dark:border-orange-700 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/10">
          <h4 className="font-semibold mb-2 text-orange-700 dark:text-orange-400">🔄 New Season Rollover</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Generate CSV for new season with reduced handicaps and cleared championship data
          </p>
          <button
            onClick={handleSeasonRollover}
            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
          >
            Generate New Season CSV
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Tip:</strong> The "Next Race CSV" is for the next month's race.
          Use "New Season Rollover" at the end of November to prepare for February with reduced handicaps.
        </p>
      </div>
    </div>
  )
}