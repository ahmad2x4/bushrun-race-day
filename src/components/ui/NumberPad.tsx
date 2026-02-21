interface NumberPadProps {
  onNumberClick: (digit: string) => void
  onBackspace: () => void
  onClear: () => void
  onCheckin: () => void
  disabled: boolean
  buttonText?: string
  onNewMember?: () => void // Optional callback for new member registration
  onSearch?: () => void // Optional callback for member search
}

function NumberPad({ onNumberClick, onBackspace, onClear, onCheckin, disabled, buttonText = "Check In Runner", onNewMember, onSearch }: NumberPadProps) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 md:p-5">
      {/* Number Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-3.5 md:gap-4 mb-3 sm:mb-4">
        {numbers.slice(0, 9).map((num) => (
          <button
            key={num}
            onClick={() => onNumberClick(num)}
            className="btn-touch-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-2xl sm:text-3xl md:text-4xl font-bold rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-3.5 md:gap-4 mb-3 sm:mb-4">
        <button
          onClick={onClear}
          className="btn-touch-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-base sm:text-lg md:text-xl font-bold rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-red-200 dark:focus:ring-red-800"
        >
          Clear
        </button>
        <button
          onClick={() => onNumberClick('0')}
          className="btn-touch-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-2xl sm:text-3xl md:text-4xl font-bold rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800"
        >
          0
        </button>
        <button
          onClick={onBackspace}
          className="btn-touch-lg bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 text-2xl sm:text-3xl md:text-4xl font-bold rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-200 dark:focus:ring-yellow-800"
        >
          ⌫
        </button>
      </div>

      {/* Action Buttons Row */}
      {onNewMember ? (
        <div className="flex gap-3 sm:gap-3.5 md:gap-4">
          {/* New Member Button - Compact */}
          <button
            onClick={onNewMember}
            aria-label="Register new member"
            className="w-14 sm:w-16 md:w-18 h-14 sm:h-16 md:h-18 text-2xl sm:text-3xl md:text-4xl font-bold rounded-lg transition-colors focus:outline-none focus:ring-4 bg-green-600 hover:bg-green-700 text-white focus:ring-green-200 dark:focus:ring-green-800"
          >
            +
          </button>
          {/* Search Member Button - Compact (only show if onSearch is provided) */}
          {onSearch && (
            <button
              onClick={onSearch}
              aria-label="Search member by name"
              className="w-14 sm:w-16 md:w-18 h-14 sm:h-16 md:h-18 rounded-lg transition-colors focus:outline-none focus:ring-4 bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-200 dark:focus:ring-purple-800 flex items-center justify-center"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
          {/* Find Runner Button - Takes remaining space */}
          <button
            onClick={onCheckin}
            disabled={disabled}
            className={`flex-1 h-14 sm:h-16 md:h-18 text-lg sm:text-xl md:text-2xl font-bold rounded-lg transition-colors focus:outline-none focus:ring-4 ${
              disabled
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'btn-primary focus:ring-blue-200 dark:focus:ring-blue-800'
            }`}
          >
            {buttonText}
          </button>
        </div>
      ) : (
        /* Check-in Button - Full Width (when onNewMember is not provided) */
        <button
          onClick={onCheckin}
          disabled={disabled}
          className={`w-full h-14 sm:h-16 md:h-18 text-lg sm:text-xl md:text-2xl font-bold rounded-lg transition-colors focus:outline-none focus:ring-4 ${
            disabled
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'btn-primary focus:ring-blue-200 dark:focus:ring-blue-800'
          }`}
        >
          {buttonText}
        </button>
      )}
    </div>
  )
}

export default NumberPad