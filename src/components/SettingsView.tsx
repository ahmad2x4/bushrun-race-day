import { useState } from 'react'
import type { ClubConfig } from '../types'
import { db } from '../db'

interface SettingsViewProps {
  clubConfig: ClubConfig
  setClubConfig: (config: ClubConfig) => void
}

function SettingsView({ clubConfig, setClubConfig }: SettingsViewProps) {
  const [tempConfig, setTempConfig] = useState<ClubConfig>(clubConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string>('')

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await db.saveClubConfig(tempConfig)
      setClubConfig(tempConfig)
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Failed to save club config:', error)
      setSaveMessage('Failed to save settings. Please try again.')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setTempConfig(clubConfig)
    setSaveMessage('')
  }

  const hasChanges = JSON.stringify(tempConfig) !== JSON.stringify(clubConfig)

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        ⚙️ Club Settings
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        
        {/* Club Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Club Name
          </label>
          <input
            type="text"
            value={tempConfig.name}
            onChange={(e) => setTempConfig({ ...tempConfig, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter club name"
          />
        </div>

        {/* Primary Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Primary Color
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={tempConfig.primary_color}
              onChange={(e) => setTempConfig({ ...tempConfig, primary_color: e.target.value })}
              className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            />
            <input
              type="text"
              value={tempConfig.primary_color}
              onChange={(e) => setTempConfig({ ...tempConfig, primary_color: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="#3b82f6"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Used for the club name and primary buttons
          </p>
        </div>

        {/* Secondary Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Secondary Color
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={tempConfig.secondary_color}
              onChange={(e) => setTempConfig({ ...tempConfig, secondary_color: e.target.value })}
              className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            />
            <input
              type="text"
              value={tempConfig.secondary_color}
              onChange={(e) => setTempConfig({ ...tempConfig, secondary_color: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="#1f2937"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Used for secondary elements and accents
          </p>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preview
          </label>
          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
            <h3 className="text-lg font-bold mb-2" style={{color: tempConfig.primary_color}}>
              {tempConfig.name || 'Your Club Name'}
            </h3>
            <button 
              className="px-4 py-2 rounded text-white font-medium"
              style={{backgroundColor: tempConfig.primary_color}}
            >
              Primary Button
            </button>
            <div className="mt-2 text-sm" style={{color: tempConfig.secondary_color}}>
              Secondary text color preview
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          
          <div className="flex items-center space-x-3">
            {saveMessage && (
              <span className={`text-sm ${
                saveMessage.includes('successfully') 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {saveMessage}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Tip:</strong> Your club settings will be saved locally and persist across sessions. 
          Colors will be applied to the main header and primary buttons throughout the application.
        </p>
      </div>
    </div>
  )
}

export default SettingsView