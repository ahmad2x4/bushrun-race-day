import { useEffect } from 'react'
import type { Race, Runner } from '../../types'
import { timeStringToMs } from '../../raceLogic'

interface PrintStartTimesProps {
  race: Race
  isOpen: boolean
  onClose: () => void
}

export default function PrintStartTimes({ race, isOpen, onClose }: PrintStartTimesProps) {
  // Trigger print dialog when component opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        window.print()
        onClose()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  // Format start time - either as clock time if race has started, or relative handicap
  const formatStartTime = (runner: Runner): string => {
    const handicap = runner.distance === '5km'
      ? runner.current_handicap_5k || '00:00'
      : runner.current_handicap_10k || '00:00'

    if (race.start_time) {
      const startMs = race.start_time + timeStringToMs(handicap)
      return new Date(startMs).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    }
    return handicap
  }

  // Get handicap time for a runner
  const getHandicap = (runner: Runner): string => {
    return runner.distance === '5km'
      ? runner.current_handicap_5k || '00:00'
      : runner.current_handicap_10k || '00:00'
  }

  // Get championship points for a runner
  const getChampionshipPoints = (runner: Runner): number => {
    return runner.distance === '5km'
      ? runner.championship_points_5k || 0
      : runner.championship_points_10k || 0
  }

  // Sort runners by distance and handicap
  const getSortedRunners = (distance: '5km' | '10km'): Runner[] => {
    return race.runners
      .filter(r => r.distance === distance)
      .sort((a, b) => {
        const aHandicap = getHandicap(a)
        const bHandicap = getHandicap(b)
        const aMs = timeStringToMs(aHandicap)
        const bMs = timeStringToMs(bHandicap)

        if (aMs !== bMs) return aMs - bMs
        return a.member_number - b.member_number
      })
  }

  const runners5k = getSortedRunners('5km')
  const runners10k = getSortedRunners('10km')

  // Render a table for a specific distance
  const renderTable = (distance: '5km' | '10km', runners: Runner[]): React.ReactNode => {
    if (runners.length === 0) {
      return (
        <div className="print-section">
          <div className="print-header">
            <h2 className="text-xl font-bold">{race.name} - {distance} Start Times</h2>
            <p className="text-sm text-gray-600 mt-1">Date: {race.date}</p>
          </div>
          <p className="text-gray-500 italic">No runners registered for {distance}</p>
        </div>
      )
    }

    return (
      <div className="print-section">
        <div className="print-header">
          <h2 className="text-xl font-bold">{race.name} - {distance} Start Times</h2>
          <p className="text-sm text-gray-600 mt-1">Date: {race.date}</p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>Member #</th>
              <th>Name</th>
              <th>Handicap</th>
              <th>Champ Points</th>
              <th>Start Time</th>
            </tr>
          </thead>
          <tbody>
            {runners.map(runner => (
              <tr key={runner.member_number}>
                <td>{runner.member_number}</td>
                <td>{runner.full_name}</td>
                <td>{getHandicap(runner)}</td>
                <td>{getChampionshipPoints(runner)}</td>
                <td>{formatStartTime(runner)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="print-start-times-container">
      {renderTable('5km', runners5k)}
      <div className="print-page-break"></div>
      {renderTable('10km', runners10k)}
    </div>
  )
}
