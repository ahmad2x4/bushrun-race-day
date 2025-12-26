import Card from '../ui/Card'
import type { Runner } from '../../types'
import { parseChampionshipRaceHistory } from '../../raceLogic'

interface ChampionshipLeaderboardProps {
  runners: Runner[]
  distance: '5km' | '10km'
  color: 'blue' | 'purple'
  onRunnerClick?: (runner: Runner) => void
}

export function ChampionshipLeaderboard({
  runners,
  distance,
  color,
  onRunnerClick
}: ChampionshipLeaderboardProps) {
  // Filter official runners for this distance with championship points
  const championshipRunners = runners
    .filter(r => {
      const isOfficial = distance === '5km' ? r.is_official_5k : r.is_official_10k
      const points = distance === '5km' ? r.championship_points_5k : r.championship_points_10k
      return r.distance === distance && isOfficial && points && points > 0
    })
    .sort((a, b) => {
      const aPoints = distance === '5km' ? a.championship_points_5k || 0 : a.championship_points_10k || 0
      const bPoints = distance === '5km' ? b.championship_points_5k || 0 : b.championship_points_10k || 0
      return bPoints - aPoints // Descending order
    })
    .slice(0, 10) // Top 10

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

  const getRaceCount = (runner: Runner) => {
    const history = distance === '5km'
      ? runner.championship_races_5k
      : runner.championship_races_10k
    return history ? parseChampionshipRaceHistory(history).length : 0
  }

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return ''
  }

  // Empty state when no championship data exists
  if (championshipRunners.length === 0) {
    return (
      <Card padding="md" shadow="md">
        <h3 className={`text-lg font-semibold mb-4 ${classes.title}`}>
          {distance} Championship Standings
        </h3>
        <div className={`${classes.bg} ${classes.border} border rounded-lg p-8`}>
          <div className="text-center text-gray-600 dark:text-gray-400">
            <div className="text-4xl mb-3">📊</div>
            <p className="font-medium mb-2">No championship data yet</p>
            <p className="text-sm">
              Championship standings will appear here after:
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Uploading a CSV file with existing championship data, OR</li>
              <li>• Completing a race and calculating results</li>
            </ul>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="md" shadow="md">
      <h3 className={`text-lg font-semibold mb-4 ${classes.title}`}>
        {distance} Championship Standings
      </h3>

      <div className="space-y-2">
        {championshipRunners.map((runner, index) => {
          const points = distance === '5km' ? runner.championship_points_5k || 0 : runner.championship_points_10k || 0
          const raceCount = getRaceCount(runner)
          const isPodium = index < 3

          return (
            <div
              key={runner.member_number}
              onClick={() => onRunnerClick?.(runner)}
              className={`p-3 rounded border ${
                isPodium ? classes.podium : classes.bg
              } ${classes.border} flex justify-between items-center ${
                onRunnerClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold w-8">
                  {getMedalEmoji(index) || `${index + 1}.`}
                </span>
                <div>
                  <div className={`font-medium ${onRunnerClick ? 'hover:underline' : ''}`}>
                    {runner.full_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    #{runner.member_number} • {raceCount} race{raceCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{points}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">points</div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
