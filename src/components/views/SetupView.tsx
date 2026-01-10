import { useState, useEffect, useMemo } from 'react'
import type { Race, Runner, AppView } from '../../types'
import { parseCSV, validateRunnerData } from '../../raceLogic'
import { db } from '../../db'
import { WordPressConfig, CSVSyncService } from '../../services'
import PrintStartTimes from '../race/PrintStartTimes'

interface SetupViewProps {
  currentRace: Race | null
  setCurrentRace: (race: Race | null) => void
  setCurrentView: (view: AppView) => void
  setShowResetConfirm: (show: boolean) => void
  resetAllCheckIns: (race: Race) => Promise<Race>
}

function SetupView({ currentRace, setCurrentRace, setCurrentView, setShowResetConfirm, resetAllCheckIns }: SetupViewProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [, setRunners] = useState<Runner[]>([])
  const [showPrintStartTimes, setShowPrintStartTimes] = useState(false)

  // WordPress auto-load state
  const [isLoadingFromWordPress, setIsLoadingFromWordPress] = useState(false)
  const [wordPressError, setWordPressError] = useState<string | null>(null)
  const [wordPressSuccess, setWordPressSuccess] = useState(false)

  // Create CSV sync service instance
  const csvSync = useMemo(() => new CSVSyncService(), [])

  // Auto-load CSV from WordPress on component mount
  useEffect(() => {
    if (currentRace) return // Already have race loaded

    const autoLoadFromWordPress = async () => {
      const wpConfig = WordPressConfig.getInstance()
      if (!wpConfig.isEnabled()) {
        return // WordPress not configured
      }

      setIsLoadingFromWordPress(true)
      setWordPressError(null)

      // Calculate previous month
      const today = new Date()
      let targetMonth = today.getMonth() // 0-11
      let targetYear = today.getFullYear()

      // Jan (0) -> load Dec (11) from previous year
      // Feb (1) -> load Dec (11) from previous year
      // Mar+ -> load previous month
      if (targetMonth <= 1) {
        targetMonth = 11
        targetYear -= 1
      } else {
        targetMonth -= 1
      }

      // TODO: Get testing mode from clubConfig context
      const useTestingMode = false

      const response = await csvSync.pullCSVFromWordPress(
        targetMonth + 1, // Convert to 1-12
        targetYear,
        useTestingMode
      )

      setIsLoadingFromWordPress(false)

      if (response.success) {
        // Create race from pulled runners
        const newRace: Race = {
          id: `race-${Date.now()}`,
          name: `Bushrun ${new Date().toLocaleDateString()}`,
          date: new Date().toISOString().split('T')[0],
          status: 'setup',
          runners: response.data.runners,
          race_5k_active: false,
          race_10k_active: false,
          next_temp_number: 999,
        }

        await db.saveRace(newRace)
        setCurrentRace(newRace)
        setRunners(response.data.runners)
        setWordPressSuccess(true)
        setUploadStatus('success')
      } else {
        // Show error, fallback to local upload
        setWordPressError(response.error)
      }
    }

    autoLoadFromWordPress()
  }, [currentRace, csvSync, setCurrentRace]) // Run on mount and when dependencies change

  const handleFileUpload = async (file: File) => {
    setUploadStatus('processing')
    setErrorMessage('')
    
    try {
      const text = await file.text()
      const parsedRunners = parseCSV(text)
      const validationErrors = validateRunnerData(parsedRunners)
      
      if (validationErrors.length > 0) {
        setErrorMessage(`Validation errors:\n${validationErrors.map(e => e.message).join('\n')}`)
        setUploadStatus('error')
        return
      }
      
      // Create new race
      const newRace: Race = {
        id: `race-${Date.now()}`,
        name: `Bushrun ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().split('T')[0],
        status: 'setup',
        runners: parsedRunners,
        race_5k_active: false,
        race_10k_active: false,
        next_temp_number: 999 // Initialize temp number for new members
      }
      
      // Save to database
      await db.saveRace(newRace)
      setCurrentRace(newRace)
      setRunners(parsedRunners)
      setUploadStatus('success')
      
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process CSV file')
      setUploadStatus('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'text/csv') {
      handleFileUpload(file)
    } else {
      setErrorMessage('Please upload a CSV file')
      setUploadStatus('error')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const startCheckin = async () => {
    if (currentRace) {
      const updatedRace = { ...currentRace, status: 'checkin' as const }
      await db.saveRace(updatedRace)
      setCurrentRace(updatedRace)
      setCurrentView('checkin') // Auto-navigate to check-in view
    }
  }

  const handleResetCheckIns = async () => {
    if (currentRace) {
      const resetRace = await resetAllCheckIns(currentRace)
      setCurrentRace(resetRace)
      setUploadStatus('success') // Show the success state again
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Race Setup</h2>
      
      {!currentRace ? (
        <div className="space-y-6">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Upload a CSV file with runner data to configure the race.
          </p>

          {/* WordPress Loading Indicator */}
          {isLoadingFromWordPress && (
            <div className="text-center py-8">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading race data from WordPress...</p>
            </div>
          )}

          {/* WordPress Error Message */}
          {wordPressError && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                WordPress Connection Issue
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">{wordPressError}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Falling back to local CSV upload. You can still upload a CSV file below.
              </p>
            </div>
          )}

          {/* WordPress Success Message */}
          {wordPressSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Race data loaded from WordPress successfully
              </p>
            </div>
          )}

          {/* CSV Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : uploadStatus === 'error'
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadStatus === 'processing'}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 text-gray-400">
                📄
              </div>
              
              <div>
                <p className="text-lg font-medium">
                  {uploadStatus === 'processing' ? 'Processing...' : 'Drop CSV file here or click to upload'}
                </p>
                <p className="text-sm text-gray-500">
                  CSV file with columns: member_number, full_name, is_financial_member, distance, current_handicap_5k, current_handicap_10k, is_official_5k, is_official_10k
                  <br />
                  <span className="text-xs text-gray-400">Handicap times represent start delays (lower = earlier start). Official flags default to true if not specified.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {uploadStatus === 'error' && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4">
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">Upload Error</h3>
              <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{errorMessage}</pre>
            </div>
          )}

        </div>
      ) : (
        /* Race Configuration */
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
              ✅ Race Configured Successfully
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">{currentRace.runners.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Runners</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">
                  {currentRace.runners.filter(r => r.distance === '5km').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">5K Runners</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-2xl font-bold text-purple-600">
                  {currentRace.runners.filter(r => r.distance === '10km').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">10K Runners</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">
                  {currentRace.runners.filter(r => {
                    const isOfficial = r.distance === '5km' ? (r.is_official_5k ?? true) : (r.is_official_10k ?? true)
                    return isOfficial
                  }).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Official</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-2xl font-bold text-orange-600">
                  {currentRace.runners.filter(r => {
                    const isOfficial = r.distance === '5km' ? (r.is_official_5k ?? true) : (r.is_official_10k ?? true)
                    return !isOfficial
                  }).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Provisional</div>
              </div>
            </div>

            {/* Status-specific information */}
            {currentRace.status === 'finished' && (
              <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                  🏁 Race Completed
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  This race has been completed. To start a new race session, reset the check-ins below
                  or upload a new CSV file with fresh runner data.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {currentRace.status === 'finished' ? (
                <button
                  onClick={handleResetCheckIns}
                  className="btn-primary px-6 py-3 text-lg font-semibold flex-1 sm:flex-none"
                >
                  🔄 Reset for New Race →
                </button>
              ) : (
                <button
                  onClick={startCheckin}
                  className="btn-primary px-6 py-3 text-lg font-semibold flex-1 sm:flex-none"
                >
                  Start Runner Check-in →
                </button>
              )}
              <button
                onClick={() => setShowPrintStartTimes(true)}
                className="px-6 py-3 text-lg font-semibold border border-blue-300 text-blue-700 dark:text-blue-400 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>🖨️</span>
                Print Start Times
              </button>
              <button
                onClick={() => {
                  setUploadStatus('idle')
                  setErrorMessage('')
                  setShowResetConfirm(true)
                }}
                className="px-6 py-3 text-lg font-semibold border border-red-300 text-red-700 dark:text-red-400 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Reset Race
              </button>
            </div>
          </div>

          {/* Runner Preview - Mobile-Optimized Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Runner Preview</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Showing first {Math.min(currentRace.runners.length, 10)} runners
              </p>
            </div>

            {/* Mobile-First Card Layout */}
            <div className="max-h-80 overflow-y-auto">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {currentRace.runners.slice(0, 10).map((runner) => {
                  const isOfficial = runner.distance === '5km'
                    ? (runner.is_official_5k ?? true)
                    : (runner.is_official_10k ?? true)
                  const startDelay = runner.distance === '5km' ? runner.current_handicap_5k : runner.current_handicap_10k

                  return (
                    <div key={runner.member_number}
                         className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">

                      {/* Header Row - Number and Name */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            #{runner.member_number}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white leading-tight break-words">
                            {runner.full_name}
                          </h4>
                        </div>
                      </div>

                      {/* Full-Width Mobile Info Grid */}
                      <div className="grid grid-cols-3 gap-3">

                        {/* Distance Badge */}
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Distance</div>
                          <span className={`inline-flex items-center w-full justify-center px-2 py-1.5 text-sm font-medium rounded-lg ${
                            runner.distance === '5km'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                          }`}>
                            {runner.distance}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</div>
                          <span className={`inline-flex items-center w-full justify-center px-2 py-1.5 text-sm font-medium rounded-lg ${
                            isOfficial
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                          }`}>
                            {isOfficial ? 'Official' : 'Provisional'}
                          </span>
                        </div>

                        {/* Start Delay */}
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start Delay</div>
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1.5 text-sm font-mono font-semibold text-gray-900 dark:text-white">
                            {startDelay || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Membership Info - Full width on larger screens */}
                      <div className="hidden xs:flex items-center justify-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          runner.is_financial_member
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {runner.is_financial_member ? 'Financial Member' : 'Non-Financial Member'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* More Runners Indicator */}
              {currentRace.runners.length > 10 && (
                <div className="p-4 text-center border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ... and {currentRace.runners.length - 10} more runners
                  </span>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Complete list available in check-in view
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {currentRace && (
        <PrintStartTimes
          race={currentRace}
          isOpen={showPrintStartTimes}
          onClose={() => setShowPrintStartTimes(false)}
        />
      )}
    </div>
  )
}

export default SetupView