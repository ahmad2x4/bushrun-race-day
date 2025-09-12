import type { Meta, StoryObj } from '@storybook/react'
import { useState, useCallback } from 'react'
import FinishLineRegistration from './FinishLineRegistration'
import type { Runner } from '../../types'

const mockRunners: Runner[] = [
  {
    member_number: 331,
    full_name: "Ahmad Reza Zarei",
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: "09:30",
    checked_in: true
  },
  {
    member_number: 200,
    full_name: "Sarah Johnson",
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: "02:15",
    checked_in: true
  },
  {
    member_number: 150,
    full_name: "Mike Thompson",
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: "08:45",
    checked_in: true
  },
  {
    member_number: 89,
    full_name: "Lisa Chen",
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: "01:45",
    checked_in: true
  },
  {
    member_number: 45,
    full_name: "David Wilson",
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: "07:20",
    checked_in: true
  },
  {
    member_number: 123,
    full_name: "Emma Rodriguez",
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: "03:00",
    checked_in: true
  },
  {
    member_number: 67,
    full_name: "Tom Anderson",
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: "06:15",
    checked_in: true
  },
  {
    member_number: 234,
    full_name: "Grace Kim",
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: "02:30",
    checked_in: true
  }
]

const meta: Meta<typeof FinishLineRegistration> = {
  title: 'Race/FinishLineRegistration',
  component: FinishLineRegistration,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive finish line registration component with drag-and-drop functionality for race directors.'
      }
    }
  },
  argTypes: {
    isRaceRunning: {
      control: 'boolean',
      description: 'Whether the race is currently running'
    },
    elapsedTime: {
      control: { type: 'number', min: 0, max: 3600000, step: 1000 },
      description: 'Elapsed race time in milliseconds'
    }
  }
}

export default meta
type Story = StoryObj<typeof FinishLineRegistration>

// Interactive wrapper component for the story
function InteractiveWrapper(args: any) {
  const [finishTimes, setFinishTimes] = useState<any[]>([])
  const [runnerAssignments, setRunnerAssignments] = useState<Record<string, number>>({})
  const [currentTime, setCurrentTime] = useState(args.elapsedTime || 0)

  // Simulate race timer
  useState(() => {
    if (args.isRaceRunning) {
      const interval = setInterval(() => {
        setCurrentTime((prev: number) => prev + 100)
      }, 100)
      return () => clearInterval(interval)
    }
  })

  const handleFinishTimeRecorded = useCallback((finishTime: any) => {
    setFinishTimes(prev => [...prev, finishTime])
    console.log('Finish time recorded:', finishTime)
  }, [])

  const handleRunnerAssigned = useCallback((runnerId: number, finishTimeId: string) => {
    setRunnerAssignments(prev => ({
      ...prev,
      [finishTimeId]: runnerId
    }))
    console.log('Runner assigned:', { runnerId, finishTimeId })
  }, [])

  const handleRunnerRemoved = useCallback((runnerId: number, finishTimeId: string) => {
    setRunnerAssignments(prev => {
      const updated = { ...prev }
      delete updated[finishTimeId]
      return updated
    })
    console.log('Runner removed:', { runnerId, finishTimeId })
  }, [])

  // Update finish times with runner assignments
  const updatedFinishTimes = finishTimes.map(ft => ({
    ...ft,
    runnerId: runnerAssignments[ft.id]
  }))

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Finish Line Registration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Click "FINISH!" to record finish times, then drag race numbers to assign them to finish positions.
        </p>
      </div>
      
      <FinishLineRegistration
        {...args}
        elapsedTime={currentTime}
        onFinishTimeRecorded={handleFinishTimeRecorded}
        onRunnerAssigned={handleRunnerAssigned}
        onRunnerRemoved={handleRunnerRemoved}
      />
      
      {/* Debug Information */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Debug Info:</h3>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div>Finish times recorded: {updatedFinishTimes.length}</div>
          <div>Assigned runners: {Object.keys(runnerAssignments).length}</div>
          <div>Available runners: {args.availableRunners.length - Object.values(runnerAssignments).length}</div>
        </div>
        
        {updatedFinishTimes.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white">
              Finish Times Detail
            </summary>
            <pre className="mt-2 text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto">
              {JSON.stringify(updatedFinishTimes, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export const Default: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    availableRunners: mockRunners,
    isRaceRunning: true,
    elapsedTime: 0
  }
}

export const RaceNotStarted: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    availableRunners: mockRunners,
    isRaceRunning: false,
    elapsedTime: 0
  }
}

export const MidRace: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    availableRunners: mockRunners,
    isRaceRunning: true,
    elapsedTime: 1500000 // 25 minutes
  }
}

export const FewRunners: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    availableRunners: mockRunners.slice(0, 4),
    isRaceRunning: true,
    elapsedTime: 0
  }
}

export const DarkMode: Story = {
  render: (args) => (
    <div className="dark">
      <InteractiveWrapper {...args} />
    </div>
  ),
  args: {
    availableRunners: mockRunners,
    isRaceRunning: true,
    elapsedTime: 900000 // 15 minutes
  },
  parameters: {
    backgrounds: { default: 'dark' }
  }
}