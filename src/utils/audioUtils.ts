// Audio utilities for race start beeps
export interface AudioConfig {
  enabled: boolean
  volume: number // 0.0 to 1.0
}

export interface AudioState {
  isLoaded: boolean
  isInitialized: boolean
  requiresUserGesture: boolean
  isMobile: boolean
  supportsVibration: boolean
}

class AudioManager {
  private audio: HTMLAudioElement | null = null
  private audioBuffer: AudioBuffer | null = null
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private config: AudioConfig = {
    enabled: true,
    volume: 0.5
  }
  private isLoaded = false
  private isPlaying = false
  private isInitialized = false
  private requiresUserGesture = true
  private isMobile = false
  private supportsVibration = false

  constructor() {
    this.detectMobileAndCapabilities()
    this.loadConfig()
    // Don't initialize audio immediately - wait for user gesture
  }

  private detectMobileAndCapabilities() {
    // Detect mobile browsers
    const userAgent = navigator.userAgent || (navigator as { vendor?: string }).vendor || (window as unknown as { opera: string }).opera
    this.isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())

    // Check for vibration support
    this.supportsVibration = 'vibrate' in navigator

    // Mobile browsers typically require user gesture for audio
    this.requiresUserGesture = this.isMobile || /safari/i.test(userAgent)

    console.log('Audio capabilities detected:', {
      isMobile: this.isMobile,
      supportsVibration: this.supportsVibration,
      requiresUserGesture: this.requiresUserGesture
    })
  }

  public async initializeAudio(): Promise<boolean> {
    if (this.isInitialized) {
      return true
    }

    try {
      // Try Web Audio API first for better mobile support
      if (this.isMobile && window.AudioContext) {
        return await this.initWebAudio()
      } else {
        return await this.initHTMLAudio()
      }
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      return false
    }
  }

  private async initWebAudio(): Promise<boolean> {
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

      // Resume context if suspended (required for mobile)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain()
      this.gainNode.connect(this.audioContext.destination)
      this.gainNode.gain.value = this.config.volume

      // Load audio file
      const response = await fetch('/Race Start Beeps.mp3')
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      this.audioBuffer = audioBuffer // Store for playback
      this.isLoaded = true
      this.isInitialized = true
      this.requiresUserGesture = false

      console.log('Web Audio API initialized successfully')
      return true
    } catch (error) {
      console.error('Web Audio API initialization failed:', error)
      // Fallback to HTML Audio
      return await this.initHTMLAudio()
    }
  }

  private async initHTMLAudio(): Promise<boolean> {
    try {
      this.audio = new Audio('/Race Start Beeps.mp3')
      this.audio.preload = 'auto'

      return new Promise((resolve) => {
        const onLoaded = () => {
          this.isLoaded = true
          this.isInitialized = true
          this.requiresUserGesture = false
          console.log('HTML Audio initialized successfully')
          resolve(true)
        }

        const onError = (e: Event) => {
          console.error('Error loading race start beeps:', e)
          this.isLoaded = false
          resolve(false)
        }

        this.audio!.addEventListener('loadeddata', onLoaded, { once: true })
        this.audio!.addEventListener('error', onError, { once: true })

        this.audio!.addEventListener('ended', () => {
          this.isPlaying = false
        })

        // Set initial volume
        this.audio!.volume = this.config.volume

        // Try to load - this might trigger the user gesture requirement
        try {
          this.audio!.load()
        } catch (loadError) {
          console.warn('Audio load requires user gesture:', loadError)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('Failed to create HTML Audio element:', error)
      return false
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
    if (!this.config.enabled) {
      return false
    }

    // Initialize audio if not already done and user gesture is available
    if (!this.isInitialized) {
      const initialized = await this.initializeAudio()
      if (!initialized) {
        console.warn('Audio not initialized, triggering fallback alerts')
        this.triggerFallbackAlerts()
        return false
      }
    }

    if (this.isPlaying) {
      return false
    }

    try {
      this.isPlaying = true
      let success = false

      // Try Web Audio API first if available
      if (this.audioContext && this.audioBuffer) {
        success = await this.playWebAudio()
      } else if (this.audio && this.isLoaded) {
        success = await this.playHTMLAudio()
      }

      if (success) {
        console.log('Playing race start beep')
        // Also trigger vibration on mobile if supported
        if (this.isMobile && this.supportsVibration) {
          this.triggerVibration()
        }
        return true
      } else {
        this.triggerFallbackAlerts()
        return false
      }
    } catch (error) {
      console.error('Error playing start beep:', error)
      this.isPlaying = false
      this.triggerFallbackAlerts()
      return false
    }
  }

  private async playWebAudio(): Promise<boolean> {
    if (!this.audioContext || !this.gainNode || !this.audioBuffer) {
      return false
    }

    try {
      const source = this.audioContext.createBufferSource()
      source.buffer = this.audioBuffer
      source.connect(this.gainNode)

      source.onended = () => {
        this.isPlaying = false
      }

      source.start(0)
      return true
    } catch (error) {
      console.error('Web Audio playback failed:', error)
      return false
    }
  }

  private async playHTMLAudio(): Promise<boolean> {
    if (!this.audio) {
      return false
    }

    try {
      // Reset audio to beginning
      this.audio.currentTime = 0
      await this.audio.play()
      return true
    } catch (error) {
      console.error('HTML Audio playback failed:', error)
      return false
    }
  }

  private triggerVibration() {
    if (this.supportsVibration && navigator.vibrate) {
      // Vibration pattern: 3 short pulses
      navigator.vibrate([200, 100, 200, 100, 200])
    }
  }

  private triggerFallbackAlerts() {
    // Trigger vibration as fallback alert
    if (this.isMobile && this.supportsVibration) {
      this.triggerVibration()
    }
    // Note: Visual alerts will be handled by the UI components
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

    // Update volume for both audio systems
    if (this.gainNode) {
      this.gainNode.gain.value = this.config.volume
    }
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
    return this.isLoaded && this.isInitialized && (this.audio !== null || this.audioBuffer !== null)
  }

  public getAudioState(): AudioState {
    return {
      isLoaded: this.isLoaded,
      isInitialized: this.isInitialized,
      requiresUserGesture: this.requiresUserGesture,
      isMobile: this.isMobile,
      supportsVibration: this.supportsVibration
    }
  }

  public syncWithClubConfig(clubConfig: { audio_enabled?: boolean; audio_volume?: number }) {
    // Update settings from club config
    this.config.enabled = clubConfig.audio_enabled ?? true
    this.config.volume = clubConfig.audio_volume ?? 0.5

    // Update volume for both audio systems
    if (this.gainNode) {
      this.gainNode.gain.value = this.config.volume
    }
    if (this.audio) {
      this.audio.volume = this.config.volume
    }

    // Save to localStorage for persistence
    this.saveConfig()
  }

  public async testBeep(): Promise<boolean> {
    // Force play even if disabled (for settings test)
    // Initialize audio if not already done
    if (!this.isInitialized) {
      const initialized = await this.initializeAudio()
      if (!initialized) {
        return false
      }
    }

    try {
      let success = false

      // Try Web Audio API first if available
      if (this.audioContext && this.audioBuffer) {
        success = await this.playWebAudio()
      } else if (this.audio && this.isLoaded) {
        success = await this.playHTMLAudio()
      }

      return success
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
export const getAudioState = () => audioManager.getAudioState()
export const isAudioReady = () => audioManager.isAudioReady()
export const testAudioBeep = () => audioManager.testBeep()
export const initializeAudio = () => audioManager.initializeAudio()
export const syncAudioWithClubConfig = (clubConfig: { audio_enabled?: boolean; audio_volume?: number }) =>
  audioManager.syncWithClubConfig(clubConfig)