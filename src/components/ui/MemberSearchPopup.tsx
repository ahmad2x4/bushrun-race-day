import { useState, useEffect, useRef } from 'react'
import type { Runner } from '../../types'

interface MemberSearchPopupProps {
  isOpen: boolean
  onClose: () => void
  onSelectMember: (memberNumber: string) => void
  runners: Runner[]
}

function MemberSearchPopup({ isOpen, onClose, onSelectMember, runners }: MemberSearchPopupProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [matchingRunners, setMatchingRunners] = useState<Runner[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Filter runners based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchingRunners([])
      return
    }

    const query = searchQuery.toLowerCase()
    const matches = runners.filter(runner =>
      runner.full_name.toLowerCase().includes(query)
    ).slice(0, 10) // Limit to 10 results for performance

    setMatchingRunners(matches)
  }, [searchQuery, runners])

  const handleSelectMember = (memberNumber: number) => {
    onSelectMember(memberNumber.toString())
    setSearchQuery('')
    setMatchingRunners([])
    onClose()
  }

  const handleClose = () => {
    setSearchQuery('')
    setMatchingRunners([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Search Member
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type member name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Results List - Fixed height container */}
        <div className="relative">
          <div className="h-[240px] overflow-y-auto p-2">
            {searchQuery.trim() === '' ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Start typing to search for a member
              </div>
            ) : matchingRunners.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No members found matching "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-1">
                {matchingRunners.map((runner) => (
                  <button
                    key={runner.member_number}
                    onClick={() => handleSelectMember(runner.member_number)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {runner.full_name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Member #{runner.member_number}
                      {runner.checked_in && (
                        <span className="ml-2 text-green-600 dark:text-green-400">
                          ✓ Checked in
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scroll indicator - shown when more than 3 results */}
          {matchingRunners.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-800 via-white/90 dark:via-gray-800/90 to-transparent h-12 pointer-events-none flex items-end justify-center pb-2">
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full">
                Showing {matchingRunners.length} results • Scroll for more
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemberSearchPopup
