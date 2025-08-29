function LoadingView() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Initializing database...</p>
      </div>
    </div>
  )
}

export default LoadingView