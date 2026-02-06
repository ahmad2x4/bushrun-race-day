import { useState } from 'react'
import type { Runner } from '../../types'

interface TimekeeperModalProps {
  isOpen: boolean
  onClose: () => void
  runners: Runner[]
  onAddTimekeeper: (runnerNumber: number) => void
  onRemoveTimekeeper: (runnerNumber: number) => void
}

function TimekeeperModal({
  isOpen,
  onClose,
  runners,
  onAddTimekeeper,
  onRemoveTimekeeper
}: TimekeeperModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const timekeepers = runners.filter(r => r.status === 'starter_timekeeper')

  const handleAdd = () => {
    setError('')

    // Parse the input - remove # if present and convert to number
    const cleanedInput = inputValue.trim().replace(/^#/, '')
    const runnerNumber = parseInt(cleanedInput, 10)

    // Validation
    if (!cleanedInput || isNaN(runnerNumber)) {
      setError('Please enter a valid runner number')
      return
    }

    // Check if already a timekeeper
    if (timekeepers.some(t => t.member_number === runnerNumber)) {
      setError(`Runner #${runnerNumber} is already a timekeeper`)
      return
    }

    // Check if runner exists
    const runner = runners.find(r => r.member_number === runnerNumber)
    if (!runner) {
      setError(`Runner #${runnerNumber} not found in the race`)
      return
    }

    // Add the timekeeper
    onAddTimekeeper(runnerNumber)
    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            ⏱️ Manage Timekeepers
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Add Timekeeper Section */}
          <div>
            <label htmlFor="runner-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter Runner Number
            </label>
            <div className="flex gap-2">
              <input
                id="runner-number"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="#123 or just 123"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Add Timekeeper
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Timekeepers receive 4 championship points and handicap adjusted -30s (10km only)
            </p>
          </div>

          {/* Current Timekeepers List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Timekeepers ({timekeepers.length})
            </h3>
            {timekeepers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No timekeepers assigned yet
              </p>
            ) : (
              <div className="space-y-2">
                {timekeepers.map((timekeeper) => (
                  <div
                    key={timekeeper.member_number}
                    className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-purple-900 dark:text-purple-200">
                        #{timekeeper.member_number}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {timekeeper.full_name}
                      </span>
                      {timekeeper.checked_in && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded-full">
                          Checked in
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveTimekeeper(timekeeper.member_number)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                      aria-label={`Remove ${timekeeper.full_name} as timekeeper`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TimekeeperModal
