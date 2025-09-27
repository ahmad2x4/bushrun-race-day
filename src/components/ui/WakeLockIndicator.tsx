import { useWakeLockContext } from '../../hooks/useWakeLockContext'

interface WakeLockIndicatorProps {
  className?: string
}

export default function WakeLockIndicator({ className = '' }: WakeLockIndicatorProps) {
  const { isSupported, isActive, error } = useWakeLockContext()

  // Show debug info in development mode
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">
          Wake Lock: {isSupported ? '✅' : '❌'} |
          Active: {isActive ? '🔒' : '🔓'} |
          Error: {error ? '⚠️' : '✅'}
        </div>
      </div>
    )
  }

  // Production behavior: only show when there's something to display
  if (!isSupported) {
    // On mobile, show a subtle indicator that wake lock isn't available
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          <span className="font-medium">Screen Lock Not Available</span>
        </div>
      </div>
    )
  }

  if (!isActive && !error) {
    return null // Don't show indicator when inactive and no error
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {isActive && (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium">Screen Stay Awake</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          <span className="font-medium">Wake Lock Unavailable</span>
        </div>
      )}
    </div>
  )
}