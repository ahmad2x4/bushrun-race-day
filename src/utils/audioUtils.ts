// Audio utilities for race start beeps
export interface AudioConfig {
  enabled: boolean
  volume: number // 0.0 to 1.0
}

class AudioManager {
  private audio: HTMLAudioElement | null = null
  private config: AudioConfig = {
    enabled: true,
    volume: 0.5
  }
  private isLoaded = false
  private isPlaying = false

  constructor() {
    this.initAudio()
    this.loadConfig()
  }

  private initAudio() {
    try {
      this.audio = new Audio('/Race Start Beeps.mp3')
      this.audio.preload = 'auto'

      this.audio.addEventListener('loadeddata', () => {
        this.isLoaded = true
        console.log('Race start beeps audio loaded')
      })

      this.audio.addEventListener('ended', () => {
        this.isPlaying = false
      })

      this.audio.addEventListener('error', (e) => {
        console.error('Error loading race start beeps:', e)
        this.isLoaded = false
      })

      // Set initial volume
      this.audio.volume = this.config.volume
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }

  private loadConfig() {
    try {
      const saved = localStorage.getItem('raceAudioConfig')
      if (saved) {
        const parsedConfig = JSON.parse(saved)
        this.config = { ...this.config, ...parsedConfig }
        if (this.audio) {
          this.audio.volume = this.config.volume
        }
      }
    } catch (error) {
      console.error('Error loading audio config:', error)
    }
  }

  private saveConfig() {
    try {
      localStorage.setItem('raceAudioConfig', JSON.stringify(this.config))
    } catch (error) {
      console.error('Error saving audio config:', error)
    }
  }

  public async playStartBeep(): Promise<boolean> {
    if (!this.config.enabled || !this.audio || !this.isLoaded || this.isPlaying) {
      return false
    }

    try {
      // Reset audio to beginning
      this.audio.currentTime = 0
      this.isPlaying = true

      await this.audio.play()
      console.log('Playing race start beep')
      return true
    } catch (error) {
      console.error('Error playing start beep:', error)
      this.isPlaying = false
      return false
    }
  }

  public stopBeep() {
    if (this.audio && this.isPlaying) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.isPlaying = false
    }
  }

  public setVolume(volume: number) {
    // Clamp volume between 0 and 1
    this.config.volume = Math.max(0, Math.min(1, volume))
    if (this.audio) {
      this.audio.volume = this.config.volume
    }
    this.saveConfig()
  }

  public setEnabled(enabled: boolean) {
    this.config.enabled = enabled
    this.saveConfig()
  }

  public getConfig(): AudioConfig {
    return { ...this.config }
  }

  public isAudioReady(): boolean {
    return this.isLoaded && this.audio !== null
  }

  public syncWithClubConfig(clubConfig: { audio_enabled?: boolean; audio_volume?: number }) {
    // Update settings from club config
    this.config.enabled = clubConfig.audio_enabled ?? true
    this.config.volume = clubConfig.audio_volume ?? 0.5

    if (this.audio) {
      this.audio.volume = this.config.volume
    }

    // Save to localStorage for persistence
    this.saveConfig()
  }

  public async testBeep(): Promise<boolean> {
    // Force play even if disabled (for settings test)
    if (!this.audio || !this.isLoaded) {
      return false
    }

    try {
      this.audio.currentTime = 0
      await this.audio.play()
      return true
    } catch (error) {
      console.error('Error testing beep:', error)
      return false
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager()

// Convenience functions
export const playStartBeep = () => audioManager.playStartBeep()
export const setAudioVolume = (volume: number) => audioManager.setVolume(volume)
export const setAudioEnabled = (enabled: boolean) => audioManager.setEnabled(enabled)
export const getAudioConfig = () => audioManager.getConfig()
export const isAudioReady = () => audioManager.isAudioReady()
export const testAudioBeep = () => audioManager.testBeep()
export const syncAudioWithClubConfig = (clubConfig: { audio_enabled?: boolean; audio_volume?: number }) =>
  audioManager.syncWithClubConfig(clubConfig)