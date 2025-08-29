import { useState, useEffect } from 'react'
import { initializeDatabase, db } from '../db'
import type { ClubConfig, Race } from '../types'

export function useDatabase() {
  const [isDbInitialized, setIsDbInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initDb = async () => {
      try {
        await initializeDatabase()
        setIsDbInitialized(true)
        setError(null)
      } catch (error) {
        console.error('Failed to initialize database:', error)
        setError('Failed to initialize database')
        setIsDbInitialized(true) // Continue anyway
      }
    }
    
    initDb()
  }, [])

  return { isDbInitialized, error }
}

export function useClubConfig() {
  const [clubConfig, setClubConfig] = useState<ClubConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await db.getClubConfig()
        setClubConfig(config)
      } catch (error) {
        console.error('Failed to load club config:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  const updateConfig = async (config: ClubConfig) => {
    try {
      await db.saveClubConfig(config)
      setClubConfig(config)
    } catch (error) {
      console.error('Failed to save club config:', error)
      throw error
    }
  }

  return { clubConfig, loading, updateConfig }
}

export function useCurrentRace() {
  const [currentRace, setCurrentRace] = useState<Race | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRace = async () => {
      try {
        const race = await db.getCurrentRace()
        setCurrentRace(race)
      } catch (error) {
        console.error('Failed to load current race:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRace()
  }, [])

  const updateRace = async (race: Race) => {
    try {
      await db.saveRace(race)
      setCurrentRace(race)
    } catch (error) {
      console.error('Failed to save race:', error)
      throw error
    }
  }

  const deleteRace = async () => {
    if (currentRace) {
      try {
        await db.deleteRace(currentRace.id)
        setCurrentRace(null)
      } catch (error) {
        console.error('Failed to delete race:', error)
        throw error
      }
    }
  }

  return { currentRace, loading, updateRace, deleteRace, setCurrentRace }
}