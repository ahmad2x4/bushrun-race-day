import { useState } from 'react'
import type { Race, Runner } from '../../types'
import { db } from '../../db'
import NumberPad from '../ui/NumberPad'

interface CheckinViewProps {
  currentRace: Race | null
  setCurrentRace: (race: Race | null) => void
}

function CheckinView({ currentRace, setCurrentRace }: CheckinViewProps) {
  const [memberNumber, setMemberNumber] = useState('')
  const [checkinStatus, setCheckinStatus] = useState<'idle' | 'success' | 'error' | 'already_checked_in'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [checkinStep, setCheckinStep] = useState<'member_number' | 'distance_selection' | 'complete'>('member_number')
  const [foundRunner, setFoundRunner] = useState<Runner | null>(null)
  const [selectedDistance, setSelectedDistance] = useState<'5km' | '10km'>('5km')

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
    } else if (checkinStep === 'distance_selection' && foundRunner) {
      // Check if distance changed before updating
      const distanceChanged = foundRunner.distance !== selectedDistance
      const wasAlreadyCheckedIn = foundRunner.checked_in
      
      // Update runner with selected distance and ensure checked in
      foundRunner.distance = selectedDistance
      foundRunner.checked_in = true
      
      const updatedRace = { ...currentRace, runners: [...currentRace.runners] }
      await db.saveRace(updatedRace)
      setCurrentRace(updatedRace)
      
      setCheckinStatus('success')
      if (wasAlreadyCheckedIn && distanceChanged) {
        setStatusMessage(`${foundRunner.full_name}'s distance updated to ${selectedDistance}!`)
      } else if (wasAlreadyCheckedIn && !distanceChanged) {
        setStatusMessage(`${foundRunner.full_name} confirmed for ${selectedDistance} (already checked in)`)
      } else {
        setStatusMessage(`${foundRunner.full_name} successfully checked in for ${selectedDistance}!${distanceChanged ? ' (Distance updated)' : ''}`)
      }
      
      // Auto-clear after success
      setTimeout(() => {
        handleClear()
      }, 2000)
    }
  }

  const checkedInCount = currentRace.runners.filter(r => r.checked_in).length
  const totalRunners = currentRace.runners.length

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Runner Check-in</h2>
      
      {/* Status Bar */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-blue-800 dark:text-blue-200">{currentRace.name}</p>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              {checkedInCount} of {totalRunners} runners checked in
            </p>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {Math.round((checkedInCount / totalRunners) * 100)}%
          </div>
        </div>
      </div>

      {/* Step 1: Member Number Input */}
      {checkinStep === 'member_number' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter Member Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full text-center text-3xl font-bold py-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-6 mb-6 shadow-lg">
              <div className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-2 uppercase tracking-wide">
                🏃‍♂️ YOUR START DELAY TIME 🏃‍♀️
              </div>
              <div className="text-5xl font-black text-blue-900 dark:text-blue-100 mb-3 font-mono">
                {selectedDistance === '5km' ? foundRunner.current_handicap_5k || '0:00' : foundRunner.current_handicap_10k || '0:00'}
              </div>
              <div className="text-base font-semibold text-blue-700 dark:text-blue-300 mb-2">
                You will start <span className="font-black">{selectedDistance === '5km' ? foundRunner.current_handicap_5k || '0:00' : foundRunner.current_handicap_10k || '0:00'}</span> after the race begins
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
                onClick={() => setSelectedDistance('5km')}
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
                onClick={() => setSelectedDistance('10km')}
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
              className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCheckin}
              className="flex-1 btn-primary px-4 py-3 rounded-lg"
            >
              {foundRunner.checked_in 
                ? (foundRunner.distance === selectedDistance 
                    ? `Confirm ${selectedDistance}` 
                    : `Change to ${selectedDistance}`)
                : `Check In for ${selectedDistance}`
              }
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
    </div>
  )
}

export default CheckinView