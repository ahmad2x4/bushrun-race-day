import type { Runner } from '../../types'

interface PodiumDisplayProps {
  title: string
  runners: Runner[]
  color: 'blue' | 'purple'
}

export default function PodiumDisplay({ title, runners, color }: PodiumDisplayProps) {
  const sortedRunners = runners
    .filter(r => r.finish_position !== undefined)
    .sort((a, b) => a.finish_position! - b.finish_position!)

  const formatTime = (ms: number): string => {
    const totalSeconds = ms / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = (totalSeconds % 60).toFixed(1)
    return `${minutes}:${seconds.padStart(4, '0')}`
  }

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      title: 'text-blue-800 dark:text-blue-200',
      podium: 'bg-blue-100 dark:bg-blue-900/30'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20', 
      border: 'border-purple-200 dark:border-purple-800',
      title: 'text-purple-800 dark:text-purple-200',
      podium: 'bg-purple-100 dark:bg-purple-900/30'
    }
  }

  const classes = colorClasses[color]

  if (runners.length === 0) {
    return (
      <div className={`${classes.bg} ${classes.border} border rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${classes.title}`}>{title}</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No finishers yet
        </div>
      </div>
    )
  }

  return (
    <div className={`${classes.bg} ${classes.border} border rounded-lg p-6`}>
      <h3 className={`text-lg font-semibold mb-4 ${classes.title}`}>{title}</h3>
      
      {/* Podium - Top 3 */}
      {sortedRunners.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">🏆 Podium</h4>
          <div className="grid grid-cols-1 gap-3">
            {sortedRunners.slice(0, 3).map((runner, index) => {
              const positions = ['🥇 1st', '🥈 2nd', '🥉 3rd']
              return (
                <div key={runner.member_number} className={`${classes.podium} rounded p-3`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm">{positions[index]}</span>
                      <div className="font-semibold">#{runner.member_number} {runner.full_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatTime(runner.finish_time!)}</div>
                      {runner.new_handicap && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          New handicap: {runner.new_handicap}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Finishers */}
      {sortedRunners.length > 3 && (
        <div>
          <h4 className="font-medium mb-2">All Finishers ({sortedRunners.length})</h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {sortedRunners.map((runner) => (
              <div key={runner.member_number} className="flex justify-between items-center py-1 text-sm">
                <span>
                  {runner.finish_position}. #{runner.member_number} {runner.full_name}
                </span>
                <span className="font-mono">{formatTime(runner.finish_time!)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}