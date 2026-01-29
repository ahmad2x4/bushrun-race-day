/**
 * WordPress Connection Status Indicator
 * Displays whether WordPress integration is configured and connected
 */

import { useState, useEffect } from 'react'
import { WordPressConfig, WordPressClient } from '../../services'

export default function WordPressStatus() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    checkWordPressStatus()
  }, [])

  const checkWordPressStatus = async () => {
    const wpConfig = WordPressConfig.getInstance()

    if (!wpConfig.isEnabled()) {
      setIsEnabled(false)
      return
    }

    setIsEnabled(true)
    setIsChecking(true)

    try {
      const client = new WordPressClient()
      const response = await client.get('/users/me')
      setIsConnected(response.success)
    } catch {
      setIsConnected(false)
    } finally {
      setIsChecking(false)
    }
  }

  if (!isEnabled) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        WordPress: Disabled
      </div>
    )
  }

  if (isChecking) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        WordPress: Checking...
      </div>
    )
  }

  return (
    <div
      className={`text-xs font-medium flex items-center gap-1.5 ${
        isConnected
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
      }`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-600' : 'bg-red-600'
        }`}
      />
      WordPress: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  )
}
