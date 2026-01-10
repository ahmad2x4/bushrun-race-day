import { useState, useMemo } from 'react'
import type { Race } from '../../types'
import { generateResultsCSV, generateNextRaceCSV, generateSeasonRolloverCSV, downloadCSV } from '../../raceLogic'
import { WordPressConfig, CSVSyncService } from '../../services'

interface ExportSectionProps {
  currentRace: Race
}

export default function ExportSection({ currentRace }: ExportSectionProps) {
  // WordPress upload state
  const [isUploadingToWordPress, setIsUploadingToWordPress] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadingType, setUploadingType] = useState<'next-race' | 'rollover' | null>(null)

  // Create CSV sync service instance
  const csvSync = useMemo(() => new CSVSyncService(), [])
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

  const handleUploadToWordPress = async (isSeasonRollover: boolean) => {
    const wpConfig = WordPressConfig.getInstance()
    if (!wpConfig.isEnabled()) {
      setUploadError('WordPress integration not configured')
      return
    }

    setIsUploadingToWordPress(true)
    setUploadError(null)
    setUploadingType(isSeasonRollover ? 'rollover' : 'next-race')

    try {
      // Generate CSV content
      const csvContent = isSeasonRollover
        ? generateSeasonRolloverCSV(currentRace.runners)
        : generateNextRaceCSV(currentRace.runners)

      // Extract month and year from current date
      const today = new Date()
      const raceMonth = today.getMonth() + 1 // 1-12
      const raceYear = today.getFullYear()
      const raceDate = today.toISOString().split('T')[0]

      // Determine race name
      const raceName = isSeasonRollover ? 'Season Rollover' : 'Next Race'

      const response = await csvSync.pushCSVToWordPress(
        csvContent,
        raceName,
        raceDate,
        raceMonth,
        raceYear,
        isSeasonRollover
      )

      setIsUploadingToWordPress(false)

      if (response.success) {
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 5000)
      } else {
        setUploadError(response.error)
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unknown error uploading to WordPress')
      setIsUploadingToWordPress(false)
    }

    setUploadingType(null)
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
          <div className="space-y-2">
            <button
              onClick={handleExportNextRace}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Download Next Race CSV
            </button>
            <button
              onClick={() => handleUploadToWordPress(false)}
              disabled={isUploadingToWordPress}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded transition-colors text-sm"
            >
              {uploadingType === 'next-race' && isUploadingToWordPress ? 'Uploading...' : 'Upload to WordPress'}
            </button>
          </div>
        </div>

        <div className="border border-orange-200 dark:border-orange-700 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/10">
          <h4 className="font-semibold mb-2 text-orange-700 dark:text-orange-400">🔄 New Season Rollover</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Generate CSV for new season with reduced handicaps and cleared championship data
          </p>
          <div className="space-y-2">
            <button
              onClick={handleSeasonRollover}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
            >
              Generate New Season CSV
            </button>
            <button
              onClick={() => handleUploadToWordPress(true)}
              disabled={isUploadingToWordPress}
              className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded transition-colors text-sm"
            >
              {uploadingType === 'rollover' && isUploadingToWordPress ? 'Uploading...' : 'Upload to WordPress'}
            </button>
          </div>
        </div>
      </div>

      {/* WordPress Upload Status Messages */}
      {uploadSuccess && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ Race data backed up to WordPress successfully
          </p>
        </div>
      )}

      {uploadError && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-1">
            ⚠ WordPress backup failed: {uploadError}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            CSV is available locally above. You can manually upload it to WordPress later.
          </p>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Tip:</strong> The "Next Race CSV" is for the next month's race.
          Use "New Season Rollover" at the end of November to prepare for February with reduced handicaps.
        </p>
      </div>
    </div>
  )
}