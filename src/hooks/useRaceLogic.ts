import { useState } from 'react'
import type { Race, Runner } from '../types'
import { 
  calculateHandicaps, 
  timeStringToMs,
  generateResultsCSV,
  generateNextRaceCSV,
  downloadCSV
} from '../raceLogic'

export function useHandicapCalculations() {
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateRaceHandicaps = async (race: Race): Promise<Race> => {
    setIsCalculating(true)
    try {
      const finishedRunners = race.runners.filter(r => r.finish_time !== undefined)

      // Extract race month for championship updates
      const raceMonth = new Date(race.date).getMonth() + 1

      // Calculate handicaps with championship support
      const updatedRunners = calculateHandicaps(finishedRunners, raceMonth)
      
      return {
        ...race,
        runners: race.runners.map(runner => {
          const updated = updatedRunners.find(r => r.member_number === runner.member_number)
          return updated || runner
        }),
        status: 'finished' as const
      }
    } finally {
      setIsCalculating(false)
    }
  }

  return { calculateRaceHandicaps, isCalculating }
}

export function useTimeAdjustment() {
  const [adjustingTime, setAdjustingTime] = useState(false)

  const adjustFinishTime = async (
    race: Race,
    runnerId: number,
    newTimeString: string
  ): Promise<Race> => {
    setAdjustingTime(true)
    try {
      const newTimeMs = timeStringToMs(newTimeString)
      if (newTimeMs <= 0) {
        throw new Error('Invalid time format. Use MM:SS.s format.')
      }

      // Update the specific runner's time
      const updatedRunners = race.runners.map(runner => 
        runner.member_number === runnerId 
          ? { ...runner, finish_time: newTimeMs }
          : runner
      )

      // Extract race month for championship updates
      const raceMonth = new Date(race.date).getMonth() + 1

      // Recalculate positions and handicaps with championship support
      const finishedRunners = updatedRunners.filter(r => r.finish_time !== undefined)
      const runnersWithHandicaps = calculateHandicaps(finishedRunners, raceMonth)

      // Merge back with all runners
      const finalRunners = updatedRunners.map(runner => {
        const updated = runnersWithHandicaps.find(r => r.member_number === runner.member_number)
        return updated || runner
      })

      return {
        ...race,
        runners: finalRunners
      }
    } finally {
      setAdjustingTime(false)
    }
  }

  return { adjustFinishTime, adjustingTime }
}

export function useRaceExport() {
  const [exporting, setExporting] = useState(false)

  const exportResults = async (race: Race) => {
    setExporting(true)
    try {
      const csvContent = generateResultsCSV(race.runners)
      downloadCSV(`${race.name}-results.csv`, csvContent)
    } finally {
      setExporting(false)
    }
  }

  const exportNextRaceHandicaps = async (race: Race) => {
    setExporting(true)
    try {
      const csvContent = generateNextRaceCSV(race.runners)
      downloadCSV(`${race.name}-next-race-handicaps.csv`, csvContent)
    } finally {
      setExporting(false)
    }
  }

  return { exportResults, exportNextRaceHandicaps, exporting }
}

export function useRunnerFilter() {
  const [filterDistance, setFilterDistance] = useState<'all' | '5km' | '10km'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filterRunners = (runners: Runner[]) => {
    return runners.filter(runner => 
      (filterDistance === 'all' || runner.distance === filterDistance) &&
      (searchQuery === '' || runner.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const clearFilters = () => {
    setFilterDistance('all')
    setSearchQuery('')
  }

  return {
    filterDistance,
    setFilterDistance,
    searchQuery,
    setSearchQuery,
    filterRunners,
    clearFilters
  }
}