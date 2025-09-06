import type { Meta, StoryObj } from '@storybook/react-vite'
import StaggeredStartQueue from './StaggeredStartQueue'
import type { Race } from '../../types'

const meta: Meta<typeof StaggeredStartQueue> = {
  title: 'Race Components/StaggeredStartQueue',
  component: StaggeredStartQueue,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a real-time countdown queue for staggered race starts. Shows which runners start when and provides visual feedback for upcoming starts.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    elapsedTime: {
      control: { type: 'range', min: 0, max: 900000, step: 1000 },
      description: 'Race elapsed time in milliseconds'
    },
    currentRace: {
      description: 'Race object with checked-in runners and handicap times'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Mock race data
const createMockRace = (): Race => ({
  id: 'race-1',
  name: 'BBR Handicap Race',
  date: '2024-08-29',
  status: 'active',
  start_time: Date.now() - 120000, // Started 2 minutes ago
  runners: [
    {
      member_number: 101,
      full_name: 'Alice Johnson',
      is_financial_member: true,
      distance: '5km',
      current_handicap_5k: '00:00',
      checked_in: true
    },
    {
      member_number: 102, 
      full_name: 'Bob Smith',
      is_financial_member: true,
      distance: '5km',
      current_handicap_5k: '02:30',
      checked_in: true
    },
    {
      member_number: 103,
      full_name: 'Charlie Brown',
      is_financial_member: true,
      distance: '10km',
      current_handicap_10k: '03:00',
      checked_in: true
    },
    {
      member_number: 104,
      full_name: 'Diana Wilson',
      is_financial_member: true,
      distance: '5km',
      current_handicap_5k: '05:00',
      checked_in: true
    },
    {
      member_number: 105,
      full_name: 'Emma Davis',
      is_financial_member: true,
      distance: '10km',
      current_handicap_10k: '08:00',
      checked_in: true
    }
  ],
  race_5k_active: true,
  race_10k_active: true
})

export const RaceStarting: Story = {
  args: {
    currentRace: createMockRace(),
    elapsedTime: 30000 // 30 seconds elapsed
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the queue at race start with some runners already started and others about to start.'
      }
    }
  }
}

export const MidRace: Story = {
  args: {
    currentRace: createMockRace(),
    elapsedTime: 180000 // 3 minutes elapsed
  },
  parameters: {
    docs: {
      description: {
        story: 'Mid-race view showing upcoming starts with real-time countdowns.'
      }
    }
  }
}

export const AllStarted: Story = {
  args: {
    currentRace: createMockRace(),
    elapsedTime: 600000 // 10 minutes elapsed - all should have started
  },
  parameters: {
    docs: {
      description: {
        story: 'Late in the race when all runners have started - queue is empty or minimal.'
      }
    }
  }
}

export const SingleDistance: Story = {
  args: {
    currentRace: {
      ...createMockRace(),
      runners: createMockRace().runners.filter(r => r.distance === '5km')
    },
    elapsedTime: 120000 // 2 minutes elapsed
  },
  parameters: {
    docs: {
      description: {
        story: '5K-only race showing staggered starts for a single distance.'
      }
    }
  }
}

export const NoCheckedInRunners: Story = {
  args: {
    currentRace: {
      ...createMockRace(),
      runners: createMockRace().runners.map(r => ({ ...r, checked_in: false }))
    },
    elapsedTime: 120000
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no runners are checked in yet.'
      }
    }
  }
}