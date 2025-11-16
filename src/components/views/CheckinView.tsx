import { useState } from 'react'
import type { Race, Runner, ClubConfig } from '../../types'
import { db } from '../../db'
import NumberPad from '../ui/NumberPad'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useTapAndHold } from '../../hooks'
import { getHandicapForDistance } from '../../raceLogic'

// Helper functions for time manipulation
const timeToSeconds = (timeStr: string): number => {
  if (!timeStr || timeStr === '0:00') return 0
  const [minutes, seconds] = timeStr.split(':').map(Number)
  return minutes * 60 + seconds
}

const secondsToTime = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '0:00'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}


interface CheckinViewProps {
  currentRace: Race | null
  setCurrentRace: (race: Race | null) => void
  clubConfig: ClubConfig
}

function CheckinView({ currentRace, setCurrentRace, clubConfig }: CheckinViewProps) {
  const [memberNumber, setMemberNumber] = useState('')
  const [checkinStatus, setCheckinStatus] = useState<'idle' | 'success' | 'error' | 'already_checked_in'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [checkinStep, setCheckinStep] = useState<'member_number' | 'distance_selection' | 'complete'>('member_number')
  const [foundRunner, setFoundRunner] = useState<Runner | null>(null)
  const [selectedDistance, setSelectedDistance] = useState<'5km' | '10km'>('5km')
  const [showProvisionalConfirm, setShowProvisionalConfirm] = useState(false)
  const [isCalculatedHandicap, setIsCalculatedHandicap] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper function for time adjustment
  const handleTimeAdjustment = async (adjustment: number) => {
    if (!foundRunner || !currentRace) return

    const currentTimeStr = selectedDistance === '5km'
      ? foundRunner.current_handicap_5k || '0:00'
      : foundRunner.current_handicap_10k || '0:00'

    const currentSeconds = timeToSeconds(currentTimeStr)
    const newSeconds = Math.max(0, currentSeconds + adjustment) // Prevent negative times
    const newTimeStr = secondsToTime(newSeconds)

    // Update the runner object
    if (selectedDistance === '5km') {
      foundRunner.current_handicap_5k = newTimeStr
    } else {
      foundRunner.current_handicap_10k = newTimeStr
    }

    // Persist to database
    const updatedRace = { ...currentRace, runners: [...currentRace.runners] }
    await db.saveRace(updatedRace)
    setCurrentRace(updatedRace)
  }

  // Tap-and-hold handlers for time adjustment (must be called at top level)
  // Both single tap and hold use 5-second increments, hold just repeats faster
  const decreaseTimeHandlers = useTapAndHold({
    onInitialAction: () => handleTimeAdjustment(-5), // Initial: -5 seconds
    onHoldAction: () => handleTimeAdjustment(-5), // Hold: -5 seconds (repeated)
    initialDelay: 500, // Wait 500ms before switching to hold mode
    repeatInterval: 200, // During hold: repeat every 200ms
    enabled: clubConfig.enable_time_adjustment ?? true
  })

  const increaseTimeHandlers = useTapAndHold({
    onInitialAction: () => handleTimeAdjustment(5), // Initial: +5 seconds
    onHoldAction: () => handleTimeAdjustment(5), // Hold: +5 seconds (repeated)
    initialDelay: 500, // Wait 500ms before switching to hold mode
    repeatInterval: 200, // During hold: repeat every 200ms
    enabled: clubConfig.enable_time_adjustment ?? true
  })

  if (!currentRace) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Runner Check-in</h2>
        <p className="text-gray-600 dark:text-gray-400">
          No race configured. Please go to Setup and upload runner data.
        </p>
      </div>
    )
  }

  const handleNumberInput = (digit: string) => {
    if (memberNumber.length < 6) { // Reasonable limit for member numbers
      setMemberNumber(memberNumber + digit)
    }
  }

  const handleBackspace = () => {
    setMemberNumber(memberNumber.slice(0, -1))
  }

  const handleClear = () => {
    setMemberNumber('')
    setCheckinStatus('idle')
    setStatusMessage('')
    setCheckinStep('member_number')
    setFoundRunner(null)
    setSelectedDistance('5km')
  }

  // Helper function to check if runner is provisional for selected distance
  const isRunnerProvisional = (runner: Runner, distance: '5km' | '10km'): boolean => {
    return distance === '5km'
      ? (runner.is_official_5k ?? true) === false
      : (runner.is_official_10k ?? true) === false
  }

  // Perform the actual check-in process
  const performCheckin = async (runner: Runner, distance: '5km' | '10km') => {
    // Check if distance changed before updating
    const distanceChanged = runner.distance !== distance
    const wasAlreadyCheckedIn = runner.checked_in

    // Update runner with selected distance and ensure checked in
    runner.distance = distance
    runner.checked_in = true

    // Populate handicap field with calculated value if needed
    const currentHandicap = distance === '5km' ? runner.current_handicap_5k : runner.current_handicap_10k
    if (!currentHandicap || currentHandicap === '0:00' || currentHandicap === '00:00') {
      // Get calculated handicap from other distance
      const handicapInfo = getHandicapForDistance(runner, distance)
      if (handicapInfo.handicap && handicapInfo.handicap !== '00:00' && handicapInfo.isCalculated) {
        if (distance === '5km') {
          runner.current_handicap_5k = handicapInfo.handicap
        } else {
          runner.current_handicap_10k = handicapInfo.handicap
        }
      }
    }

    const updatedRace = { ...currentRace, runners: [...currentRace.runners] }
    await db.saveRace(updatedRace)
    setCurrentRace(updatedRace)

    setCheckinStatus('success')
    if (wasAlreadyCheckedIn && distanceChanged) {
      setStatusMessage(`${runner.full_name}'s distance updated to ${distance}!`)
    } else if (wasAlreadyCheckedIn && !distanceChanged) {
      setStatusMessage(`${runner.full_name} confirmed for ${distance} (already checked in)`)
    } else {
      setStatusMessage(`${runner.full_name} successfully checked in for ${distance}!${distanceChanged ? ' (Distance updated)' : ''}`)
    }

    // Auto-clear after success
    setTimeout(() => {
      handleClear()
    }, 2000)
  }

  // Handle provisional runner confirmation
  const handleProvisionalConfirm = async () => {
    if (!foundRunner || !currentRace) return

    // Promote runner to official status for the selected distance
    if (selectedDistance === '5km') {
      foundRunner.is_official_5k = true
    } else {
      foundRunner.is_official_10k = true
    }

    setShowProvisionalConfirm(false)
    setIsSubmitting(true)

    // Proceed with check-in with minimum loading time
    const minLoadingTime = 500
    const startTime = Date.now()
    try {
      await performCheckin(foundRunner, selectedDistance)

      // Ensure minimum display time for loading indicator
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle provisional runner check-in as unofficial
  const handleProvisionalCancel = async () => {
    if (!foundRunner || !currentRace) return

    setShowProvisionalConfirm(false)
    setIsSubmitting(true)

    // Proceed with check-in but keep runner as provisional (don't update official status)
    const minLoadingTime = 500
    const startTime = Date.now()
    try {
      await performCheckin(foundRunner, selectedDistance)

      // Ensure minimum display time for loading indicator
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime))
      }
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleCheckin = async () => {
    if (checkinStep === 'member_number') {
      if (!memberNumber.trim()) return

      const runner = currentRace.runners.find(r => r.member_number.toString() === memberNumber)

      if (!runner) {
        setCheckinStatus('error')
        setStatusMessage(`Member number ${memberNumber} not found in race registration.`)
        return
      }

      // Found runner - proceed to distance selection regardless of check-in status
      setFoundRunner(runner)
      setSelectedDistance(runner.distance)
      setCheckinStep('distance_selection')
      setCheckinStatus('idle')
      setStatusMessage('')

      // Check if current selection would use calculated handicap
      const currentHandicap = runner.distance === '5km' ? runner.current_handicap_5k : runner.current_handicap_10k
      if (!currentHandicap || currentHandicap === '0:00' || currentHandicap === '00:00') {
        const handicapInfo = getHandicapForDistance(runner, runner.distance)
        setIsCalculatedHandicap(handicapInfo.isCalculated)
      } else {
        setIsCalculatedHandicap(false)
      }
    } else if (checkinStep === 'distance_selection' && foundRunner) {
      // Check if runner is provisional for the selected distance
      if (isRunnerProvisional(foundRunner, selectedDistance)) {
        // Show confirmation dialog for provisional runners
        setShowProvisionalConfirm(true)
        return
      }

      // Proceed with normal check-in for official runners
      setIsSubmitting(true)
      const minLoadingTime = 500
      const startTime = Date.now()
      try {
        await performCheckin(foundRunner, selectedDistance)

        // Ensure minimum display time for loading indicator
        const elapsedTime = Date.now() - startTime
        if (elapsedTime < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime))
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const checkedInCount = currentRace.runners.filter(r => r.checked_in).length

  return (
    <div className="w-full max-w-md mx-auto px-2 sm:px-0">
      {/* Compact Status Bar */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
        <p className="text-sm text-center text-blue-800 dark:text-blue-200">
          <span className="font-semibold">{currentRace.name}</span>
          <span className="mx-2">•</span>
          <span>{checkedInCount} checked in</span>
        </p>
      </div>

      {/* Step 1: Member Number Input */}
      {checkinStep === 'member_number' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter Member Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full text-center text-2xl sm:text-3xl md:text-4xl font-bold py-3 sm:py-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
              placeholder="000"
              maxLength={6}
            />
          </div>

          {/* Status Messages */}
          {statusMessage && (
            <div className={`mt-4 p-3 rounded-lg text-center font-medium ${
              checkinStatus === 'success' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                : checkinStatus === 'already_checked_in'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
            }`}>
              {statusMessage}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Distance Selection */}
      {checkinStep === 'distance_selection' && foundRunner && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {foundRunner.full_name}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Member #{foundRunner.member_number}
            </p>
            {foundRunner.checked_in && (
              <div className="mb-4 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                ✓ Already Checked In
              </div>
            )}
            
            {/* Handicap Start Time - Prominent Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-lg">
              <div className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-2 uppercase tracking-wide">
                🏃‍♂️ YOUR START DELAY TIME 🏃‍♀️
              </div>

              {/* Time Display with +/- Buttons (conditionally) */}
              {clubConfig.enable_time_adjustment ?? true ? (
                <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
                  <button
                    {...decreaseTimeHandlers}
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl sm:text-2xl font-bold shadow-lg transition-colors flex items-center justify-center select-none flex-shrink-0"
                    title="Tap: -5 seconds, Hold: -5 seconds (faster)"
                  >
                    −
                  </button>

                  <div className="text-3xl sm:text-4xl md:text-5xl font-black text-blue-900 dark:text-blue-100 font-mono min-w-0 flex-shrink text-center px-2">
                    {selectedDistance === '5km' ? foundRunner.current_handicap_5k || '00:00' : foundRunner.current_handicap_10k || '00:00'}
                  </div>

                  <button
                    {...increaseTimeHandlers}
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl sm:text-2xl font-bold shadow-lg transition-colors flex items-center justify-center select-none flex-shrink-0"
                    title="Tap: +5 seconds, Hold: +5 seconds (faster)"
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-blue-900 dark:text-blue-100 mb-2 sm:mb-3 font-mono text-center">
                  {selectedDistance === '5km' ? foundRunner.current_handicap_5k || '00:00' : foundRunner.current_handicap_10k || '00:00'}
                </div>
              )}

              <div className="text-base font-semibold text-blue-700 dark:text-blue-300 mb-2">
                You will start <span className="font-black">{selectedDistance === '5km' ? foundRunner.current_handicap_5k || '00:00' : foundRunner.current_handicap_10k || '00:00'}</span> after the race begins
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                💡 Lower times = Earlier start • Higher times = Later start
              </div>
              <div className="mt-3 text-xs text-blue-500 dark:text-blue-500 italic">
                Wait for your time to be called before starting!
              </div>

            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {foundRunner.checked_in ? 'Change Race Distance' : 'Select Race Distance'}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSelectedDistance('5km')
                  // Update calculated handicap status when distance changes
                  if (foundRunner) {
                    const currentHandicap = foundRunner.current_handicap_5k
                    if (!currentHandicap || currentHandicap === '0:00' || currentHandicap === '00:00') {
                      const handicapInfo = getHandicapForDistance(foundRunner, '5km')
                      setIsCalculatedHandicap(handicapInfo.isCalculated)
                    } else {
                      setIsCalculatedHandicap(false)
                    }
                  }
                }}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedDistance === '5km'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="text-2xl font-bold">5K</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {foundRunner.distance === '5km' ? 'Currently Registered' : 'Switch to 5K'}
                </div>
              </button>
              <button
                onClick={() => {
                  setSelectedDistance('10km')
                  // Update calculated handicap status when distance changes
                  if (foundRunner) {
                    const currentHandicap = foundRunner.current_handicap_10k
                    if (!currentHandicap || currentHandicap === '0:00' || currentHandicap === '00:00') {
                      const handicapInfo = getHandicapForDistance(foundRunner, '10km')
                      setIsCalculatedHandicap(handicapInfo.isCalculated)
                    } else {
                      setIsCalculatedHandicap(false)
                    }
                  }
                }}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedDistance === '10km'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="text-2xl font-bold">10K</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {foundRunner.distance === '10km' ? 'Currently Registered' : 'Switch to 10K'}
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClear}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={handleCheckin}
              disabled={isSubmitting}
              className="flex-1 btn-primary px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Checking in...</span>
                </>
              ) : (
                foundRunner.checked_in
                  ? (foundRunner.distance === selectedDistance
                      ? `Confirm ${selectedDistance}`
                      : `Change to ${selectedDistance}`)
                  : `Check In for ${selectedDistance}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success/Status Messages */}
      {statusMessage && checkinStep !== 'member_number' && (
        <div className={`mb-6 p-3 rounded-lg text-center font-medium ${
          checkinStatus === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
            : checkinStatus === 'already_checked_in'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }`}>
          {statusMessage}
        </div>
      )}

      {/* Number Pad - Only show during member number entry */}
      {checkinStep === 'member_number' && (
        <NumberPad
          onNumberClick={handleNumberInput}
          onBackspace={handleBackspace}
          onClear={handleClear}
          onCheckin={handleCheckin}
          disabled={!memberNumber.trim()}
          buttonText="Find Runner"
        />
      )}

      {/* Provisional Runner Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showProvisionalConfirm}
        onClose={handleProvisionalCancel}
        onConfirm={handleProvisionalConfirm}
        title="Confirm Official Status"
        message={`${foundRunner?.full_name} is currently listed as ${isCalculatedHandicap ? '<span class="font-bold text-orange-600 dark:text-orange-400">calculated</span> provisional' : 'provisional'} for ${selectedDistance}. Has this runner participated in two or more handicap races (including Starter/Timekeeper duties) in the current or prior membership year? If yes, this race will count as official and the runner will receive championship points.`}
        confirmText="Yes, Make Official"
        cancelText="No, Check-in as Provisional"
        confirmButtonClass="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
      />
    </div>
  )
}

export default CheckinView