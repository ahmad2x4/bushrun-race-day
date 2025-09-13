import type { ClubConfig } from '../types'

export const getStorageKey = (key: string) => `bushrun-${key}`

export const getStoredClubConfig = (): ClubConfig => {
  try {
    const stored = localStorage.getItem(getStorageKey('club-config'))
    return stored ? JSON.parse(stored) : getDefaultClubConfig()
  } catch {
    return getDefaultClubConfig()
  }
}

export const saveClubConfig = (config: ClubConfig): void => {
  try {
    localStorage.setItem(getStorageKey('club-config'), JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save club config:', error)
  }
}

export const getDefaultClubConfig = (): ClubConfig => ({
  name: 'Berowra Bushrunners',
  primary_color: '#f97316', // Orange
  logo_url: '',
  website_url: 'https://berowrabushrunners.com',
  contact_email: 'info@berowrabushrunners.com'
})