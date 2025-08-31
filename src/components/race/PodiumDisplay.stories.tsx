import type { Meta, StoryObj } from '@storybook/react'
import PodiumDisplay from './PodiumDisplay'
import type { Runner } from '../../types'

const meta: Meta<typeof PodiumDisplay> = {
  title: 'Race Components/PodiumDisplay',
  component: PodiumDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays race winners in a podium format with medals and finish times. Supports themed colors for different race distances.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title displayed above the podium'
    },
    color: {
      control: { type: 'select' },
      options: ['blue', 'purple'],
      description: 'Theme color for the podium display'
    },
    runners: {
      description: 'Array of runners with finish times and positions'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Mock runner data
const createFinishedRunners = (): Runner[] => [
  {
    member_number: 101,
    full_name: 'Alice Johnson',
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: '02:00',
    checked_in: true,
    finish_time: 1890000, // 31:30.0
    finish_position: 1
  },
  {
    member_number: 102,
    full_name: 'Bob Smith',
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: '03:00',
    checked_in: true,
    finish_time: 1925000, // 32:05.0
    finish_position: 2
  },
  {
    member_number: 103,
    full_name: 'Charlie Brown',
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: '01:30',
    checked_in: true,
    finish_time: 1960000, // 32:40.0
    finish_position: 3
  },
  {
    member_number: 104,
    full_name: 'Diana Wilson',
    is_financial_member: true,
    distance: '5km',
    current_handicap_5k: '04:00',
    checked_in: true,
    finish_time: 2010000, // 33:30.0
    finish_position: 4
  }
]

const create10kmRunners = (): Runner[] => [
  {
    member_number: 201,
    full_name: 'Emma Davis',
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: '08:00',
    checked_in: true,
    finish_time: 3600000, // 60:00.0
    finish_position: 1
  },
  {
    member_number: 202,
    full_name: 'Frank Miller',
    is_financial_member: true,
    distance: '10km',
    current_handicap_10k: '10:00',
    checked_in: true,
    finish_time: 3650000, // 60:50.0
    finish_position: 2
  }
]

export const FiveKmResults: Story = {
  args: {
    title: '5K Results',
    runners: createFinishedRunners(),
    color: 'blue'
  },
  parameters: {
    docs: {
      description: {
        story: 'Full 5K podium with first, second, and third place winners plus additional finishers.'
      }
    }
  }
}

export const TenKmResults: Story = {
  args: {
    title: '10K Results',
    runners: create10kmRunners(),
    color: 'purple'
  },
  parameters: {
    docs: {
      description: {
        story: '10K podium with purple theming and fewer finishers.'
      }
    }
  }
}

export const SingleWinner: Story = {
  args: {
    title: '5K Results',
    runners: [createFinishedRunners()[0]],
    color: 'blue'
  },
  parameters: {
    docs: {
      description: {
        story: 'Podium with only one finisher - shows how component handles incomplete podiums.'
      }
    }
  }
}

export const NoFinishers: Story = {
  args: {
    title: '5K Results',
    runners: [],
    color: 'blue'
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty podium state when no runners have finished yet.'
      }
    }
  }
}

export const ManyFinishers: Story = {
  args: {
    title: '5K Championship',
    runners: [
      ...createFinishedRunners(),
      {
        member_number: 105,
        full_name: 'Grace Lee',
        is_financial_member: true,
        distance: '5km',
        current_handicap_5k: '02:30',
        checked_in: true,
        finish_time: 2055000, // 34:15.0
        finish_position: 5
      },
      {
        member_number: 106,
        full_name: 'Henry Zhang',
        is_financial_member: true,
        distance: '5km',
        current_handicap_5k: '03:30',
        checked_in: true,
        finish_time: 2100000, // 35:00.0
        finish_position: 6
      }
    ],
    color: 'purple'
  },
  parameters: {
    docs: {
      description: {
        story: 'Large race with many finishers - shows podium with additional finishers list.'
      }
    }
  }
}