import type { Meta, StoryObj } from '@storybook/react-vite'
// Simple mock function for story actions
const mockFn = () => {}
import RunnerNumberGrid from './RunnerNumberGrid'
import type { Race, Runner } from '../../types'

const meta: Meta<typeof RunnerNumberGrid> = {
  title: 'Race Components/RunnerNumberGrid',
  component: RunnerNumberGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive grid of runner numbers for recording finish times. Features color-coded status indicators, distance filtering, and progress tracking.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    isRaceRunning: {
      control: 'boolean',
      description: 'Whether the race is currently active'
    },
    showFinishSection: {
      control: 'boolean', 
      description: 'Whether to show the finish recording section'
    },
    onRecordFinishTime: {
      description: 'Callback fired when a runner finish time is recorded'
    },
    onViewResults: {
      description: 'Callback fired when view results button is clicked'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Create mock runners with different states
const createMockRunners = (): Runner[] => [
  // 5K runners
  {
    member_number: 101,
    full_name: 'Alice Johnson',
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: '02:00',
    checked_in: true,
    finish_time: 1890000, // Finished
    finish_position: 1
  },
  {
    member_number: 102,
    full_name: 'Bob Smith', 
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: '03:00',
    checked_in: true,
    status: 'dnf' // DNF
  },
  {
    member_number: 103,
    full_name: 'Charlie Brown',
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: '01:30',
    checked_in: true // Running
  },
  {
    member_number: 104,
    full_name: 'Diana Wilson',
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: '04:00',
    checked_in: true,
    status: 'early_start' // Early start
  },
  // 10K runners
  {
    member_number: 201,
    full_name: 'Emma Davis',
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: '08:00',
    checked_in: true,
    finish_time: 3600000, // Finished
    finish_position: 1
  },
  {
    member_number: 202,
    full_name: 'Frank Miller',
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: '10:00',
    checked_in: true // Running
  },
  {
    member_number: 203,
    full_name: 'Grace Lee',
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: '06:00',
    checked_in: true // Running
  },
  {
    member_number: 204,
    full_name: 'Henry Zhang',
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: '12:00',
    checked_in: true // Running
  }
]

const createMockRace = (): Race => ({
  id: 'race-1',
  name: 'BBR Handicap Race',
  date: '2024-08-29',
  status: 'active',
  start_time: Date.now() - 600000, // Started 10 minutes ago
  runners: createMockRunners(),
  race_5k_active: true,
  race_10k_active: true
})

export const ActiveRace: Story = {
  args: {
    currentRace: createMockRace(),
    isRaceRunning: true,
    showFinishSection: true,
    onRecordFinishTime: mockFn,
    onViewResults: mockFn
  },
  parameters: {
    docs: {
      description: {
        story: 'Active race with mixed runner states: finished (green), DNF (red), early start (yellow), and running (white).'
      }
    }
  }
}

export const RaceNotStarted: Story = {
  args: {
    currentRace: {
      ...createMockRace(),
      status: 'checkin'
    },
    isRaceRunning: false,
    showFinishSection: false,
    onRecordFinishTime: mockFn,
    onViewResults: mockFn
  },
  parameters: {
    docs: {
      description: {
        story: 'Race not started yet - finish section is hidden, buttons are disabled.'
      }
    }
  }
}

export const AllFinished: Story = {
  args: {
    currentRace: {
      ...createMockRace(),
      runners: createMockRunners().map((r, i) => ({
        ...r,
        finish_time: 1800000 + (i * 30000), // All finished with different times
        finish_position: i + 1
      }))
    },
    isRaceRunning: true,
    showFinishSection: true,
    onRecordFinishTime: mockFn,
    onViewResults: mockFn
  },
  parameters: {
    docs: {
      description: {
        story: 'All runners finished - shows completion state with "View Results" button.'
      }
    }
  }
}

export const FiveKmOnly: Story = {
  args: {
    currentRace: {
      ...createMockRace(),
      runners: createMockRunners().filter(r => r.distance === '5km')
    },
    isRaceRunning: true,
    showFinishSection: true,
    onRecordFinishTime: mockFn,
    onViewResults: mockFn
  },
  parameters: {
    docs: {
      description: {
        story: '5K-only race showing distance filtering and fewer total runners.'
      }
    }
  }
}

export const LargeRace: Story = {
  args: {
    currentRace: {
      ...createMockRace(),
      runners: [
        ...createMockRunners(),
        // Add more runners to show grid scaling
        ...Array.from({ length: 20 }, (_, i) => ({
          member_number: 300 + i,
          full_name: `Runner ${300 + i}`,
          is_financial_member: true,
          distance: (i % 2 === 0 ? '5km' : '10km') as '5km' | '10km',
          current_handicap_5k: i % 2 === 0 ? '03:00' : undefined,
          current_handicap_10k: i % 2 === 1 ? '09:00' : undefined,
          checked_in: true
        }))
      ]
    },
    isRaceRunning: true,
    showFinishSection: true,
    onRecordFinishTime: mockFn,
    onViewResults: mockFn
  },
  parameters: {
    docs: {
      description: {
        story: 'Large race with 28 runners showing grid responsiveness and scalability.'
      }
    }
  }
}

export const NoCheckedInRunners: Story = {
  args: {
    currentRace: {
      ...createMockRace(),
      runners: createMockRunners().map(r => ({ ...r, checked_in: false }))
    },
    isRaceRunning: true,
    showFinishSection: true,
    onRecordFinishTime: mockFn,
    onViewResults: mockFn
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no runners are checked in - shows empty message.'
      }
    }
  }
}