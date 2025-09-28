import { useCallback, useRef } from 'react'

interface UseTapAndHoldOptions {
  onInitialAction: () => void
  onHoldAction: () => void
  initialDelay?: number
  repeatInterval?: number
  enabled?: boolean
}

interface UseTapAndHoldReturn {
  onMouseDown: () => void
  onMouseUp: () => void
  onMouseLeave: () => void
  onTouchStart: () => void
  onTouchEnd: () => void
  onTouchCancel: () => void
}

export function useTapAndHold({
  onInitialAction,
  onHoldAction,
  initialDelay = 500,
  repeatInterval = 200,
  enabled = true
}: UseTapAndHoldOptions): UseTapAndHoldReturn {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isHoldingRef = useRef(false)

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    isHoldingRef.current = false
  }, [])

  const startAction = useCallback(() => {
    if (!enabled) return

    // Execute initial action immediately
    onInitialAction()
    isHoldingRef.current = true

    // Set timeout for switching to hold mode
    timeoutRef.current = setTimeout(() => {
      if (isHoldingRef.current) {
        // Start repeating action with different handler
        intervalRef.current = setInterval(() => {
          if (isHoldingRef.current) {
            onHoldAction()
          }
        }, repeatInterval)
      }
    }, initialDelay)
  }, [enabled, onInitialAction, onHoldAction, initialDelay, repeatInterval])

  const stopAction = useCallback(() => {
    cleanup()
  }, [cleanup])

  const onMouseDown = useCallback(() => {
    startAction()
  }, [startAction])

  const onMouseUp = useCallback(() => {
    stopAction()
  }, [stopAction])

  const onMouseLeave = useCallback(() => {
    stopAction()
  }, [stopAction])

  const onTouchStart = useCallback(() => {
    startAction()
  }, [startAction])

  const onTouchEnd = useCallback(() => {
    stopAction()
  }, [stopAction])

  const onTouchCancel = useCallback(() => {
    stopAction()
  }, [stopAction])

  return {
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchEnd,
    onTouchCancel
  }
}