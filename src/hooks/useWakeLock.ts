import { useState, useEffect, useRef, useCallback } from 'react'

interface WakeLockState {
  isSupported: boolean
  isActive: boolean
  isRequesting: boolean
  error: string | null
}

interface UseWakeLockReturn extends WakeLockState {
  request: () => Promise<boolean>
  release: () => Promise<boolean>
}

export function useWakeLock(): UseWakeLockReturn {
  const isSupported = 'wakeLock' in navigator

  // Add debug logging for Wake Lock support
  useEffect(() => {
    console.log('🔍 Wake Lock Debug Info:', {
      isSupported,
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol
    })
  }, [isSupported])

  const [state, setState] = useState<WakeLockState>({
    isSupported,
    isActive: false,
    isRequesting: false,
    error: null
  })

  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const request = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Wake Lock API not supported' }))
      return false
    }

    if (wakeLockRef.current) {
      // Already have an active wake lock
      return true
    }

    setState(prev => ({ ...prev, isRequesting: true, error: null }))

    try {
      const wakeLock = await navigator.wakeLock.request('screen')
      wakeLockRef.current = wakeLock

      wakeLock.addEventListener('release', () => {
        console.log('🔓 Wake lock released')
        wakeLockRef.current = null
        setState(prev => ({ ...prev, isActive: false }))
      })

      console.log('🔒 Wake lock acquired')
      setState(prev => ({
        ...prev,
        isActive: true,
        isRequesting: false,
        error: null
      }))

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error acquiring wake lock'
      console.warn('⚠️ Wake lock request failed:', errorMessage)

      setState(prev => ({
        ...prev,
        isActive: false,
        isRequesting: false,
        error: errorMessage
      }))

      return false
    }
  }, [state.isSupported])

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && state.isActive && !wakeLockRef.current) {
      // Re-acquire wake lock when page becomes visible again
      request()
    }
  }, [state.isActive, request])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleVisibilityChange])

  const release = useCallback(async (): Promise<boolean> => {
    if (!wakeLockRef.current) {
      return true
    }

    try {
      await wakeLockRef.current.release()
      wakeLockRef.current = null

      setState(prev => ({
        ...prev,
        isActive: false,
        error: null
      }))

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error releasing wake lock'
      console.warn('⚠️ Wake lock release failed:', errorMessage)

      setState(prev => ({
        ...prev,
        error: errorMessage
      }))

      return false
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.warn)
      }
    }
  }, [])

  return {
    ...state,
    request,
    release
  }
}