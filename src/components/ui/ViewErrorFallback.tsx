import Button from './Button'
import Card from './Card'

interface ViewErrorFallbackProps {
  viewName: string
  error?: Error
  onRetry?: () => void
  onNavigateHome?: () => void
}

export function ViewErrorFallback({ 
  viewName, 
  error, 
  onRetry, 
  onNavigateHome 
}: ViewErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-96 p-4">
      <Card className="max-w-md w-full">
        <div className="text-center">
          <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {viewName} Error
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Something went wrong in the {viewName} view. You can try again or return to setup.
          </p>
          
          <div className="space-y-3">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="primary"
                className="w-full"
              >
                Try Again
              </Button>
            )}
            
            {onNavigateHome && (
              <Button
                onClick={onNavigateHome}
                variant="secondary"
                className="w-full"
              >
                Return to Setup
              </Button>
            )}
          </div>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                Error Details
              </summary>
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs font-mono text-red-700 dark:text-red-300">
                {error.message}
              </div>
            </details>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ViewErrorFallback