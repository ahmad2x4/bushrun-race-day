import { useState, useEffect } from 'react'

interface NewMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  onRegister: (name: string, distance: '5km' | '10km') => Promise<number> // Returns assigned temp number
}

function NewMemberDialog({ isOpen, onClose, onRegister }: NewMemberDialogProps) {
  const [name, setName] = useState('')
  const [distance, setDistance] = useState<'5km' | '10km'>('5km')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assignedNumber, setAssignedNumber] = useState<number | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when dialog is closed
      setName('')
      setDistance('5km')
      setError('')
      setIsSubmitting(false)
      setAssignedNumber(null)
      setShowSuccess(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate name
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter a name')
      return
    }

    setIsSubmitting(true)
    try {
      const tempNumber = await onRegister(trimmedName, distance)
      setAssignedNumber(tempNumber)
      setShowSuccess(true)
      setIsSubmitting(false) // Reset submitting state after success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register member')
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Just close the dialog - all state will be reset by useEffect when isOpen becomes false
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {showSuccess && assignedNumber ? (
          // Success Screen
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Registration Complete
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You've been checked in for the race!
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                Your number is:
              </p>
              <p className="text-6xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {assignedNumber}
              </p>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Tell this number to the timekeeper at the finish line
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Done
            </button>
          </div>
        ) : (
          // Registration Form
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                New Member Registration
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Register a new member for today's race
              </p>

              <div className="mb-4">
                <label htmlFor="member-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  id="member-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                  placeholder="Enter runner's full name"
                  autoFocus
                  disabled={isSubmitting}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Distance
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDistance('5km')}
                    disabled={isSubmitting}
                    className={`py-3 px-4 font-medium rounded-lg transition border-2 ${
                      distance === '5km'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    5km
                  </button>
                  <button
                    type="button"
                    onClick={() => setDistance('10km')}
                    disabled={isSubmitting}
                    className={`py-3 px-4 font-medium rounded-lg transition border-2 ${
                      distance === '10km'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    10km
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> New member will be assigned a temporary number and checked in for {distance} with no start delay.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default NewMemberDialog
