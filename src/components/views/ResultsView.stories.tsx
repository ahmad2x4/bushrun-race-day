import type { Meta, StoryObj } from '@storybook/react-vite';
import ResultsView from './ResultsView';
import type { Race, Runner } from '../../types';

// Simple mock function for story actions
const mockFn = () => {};

const mockFinishedRace: Race = {
  id: 'test-race',
  name: 'February 2024 BBR Handicap',
  date: '2024-02-04',
  status: 'finished',
  start_time: Date.now() - 3600000, // 1 hour ago
  runners: [
    {
      member_number: 331,
      full_name: 'John Smith',
      is_financial_member: true,
      distance: '10km',
      current_handicap_10k: '09:30',
      new_handicap: '09:45',
      checked_in: true,
      finish_time: 2534500, // 42:14.5
      finish_position: 1,
      handicap_status: 'official',
      points_earned: 20,
      championship_points_10k: 65,
      championship_points_5k: 0,
      races_participated_10k: 4,
      races_participated_5k: 0,
    },
    {
      member_number: 200,
      full_name: 'Jane Doe',
      is_financial_member: true,
      distance: '5km',
      current_handicap_5k: '02:15',
      new_handicap: '02:30',
      checked_in: true,
      finish_time: 1825300, // 30:25.3
      finish_position: 2,
      handicap_status: 'official',
      points_earned: 15,
      championship_points_10k: 0,
      championship_points_5k: 27,
      races_participated_10k: 0,
      races_participated_5k: 3,
    },
    {
      member_number: 150,
      full_name: 'Mike Johnson',
      is_financial_member: true,
      distance: '10km',
      current_handicap_10k: '08:45',
      new_handicap: '08:30',
      checked_in: true,
      finish_time: 2756800, // 45:56.8
      finish_position: 3,
      handicap_status: 'official',
      points_earned: 11,
      championship_points_10k: 39,
      championship_points_5k: 0,
      races_participated_10k: 3,
      races_participated_5k: 0,
    },
    {
      member_number: 275,
      full_name: 'Sarah Wilson',
      is_financial_member: false,
      distance: '5km',
      current_handicap_5k: '03:30',
      new_handicap: '03:15',
      checked_in: true,
      finish_time: 2145600, // 35:45.6
      finish_position: 4,
      handicap_status: 'provisional',
      points_earned: 0, // Provisional handicap
      championship_points_10k: 0,
      championship_points_5k: 0,
      races_participated_10k: 0,
      races_participated_5k: 1,
    },
    {
      member_number: 180,
      full_name: 'Tom Brown',
      is_financial_member: true,
      distance: '10km',
      current_handicap_10k: '07:15',
      new_handicap: '07:15', // Unchanged
      checked_in: true,
      status: 'dnf',
      handicap_status: 'official',
      points_earned: 1,
      championship_points_10k: 29,
      championship_points_5k: 0,
      races_participated_10k: 3,
      races_participated_5k: 0,
    },
  ] as Runner[],
  race_5k_active: false,
  race_10k_active: false,
};

const meta: Meta<typeof ResultsView> = {
  title: 'Views/ResultsView',
  component: ResultsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Race results view showing podium displays, handicap calculations, results table, and export functionality.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentRace: {
      control: 'object',
      description: 'Finished race data with results',
    },
    setCurrentRace: {
      action: 'setCurrentRace',
      description: 'Function to update race state',
    },
    setCurrentView: {
      action: 'setCurrentView',
      description: 'Function to change application view',
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentRace: mockFinishedRace,
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
  },
};

export const BeforeCalculation: Story = {
  args: {
    currentRace: {
      ...mockFinishedRace,
      runners: mockFinishedRace.runners.map(r => ({ 
        ...r, 
        new_handicap: undefined,
        points_earned: undefined,
      })),
    },
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Results view before handicap calculations showing calculate button',
      },
    },
  },
};

export const LargeField: Story = {
  args: {
    currentRace: {
      ...mockFinishedRace,
      runners: [
        ...mockFinishedRace.runners,
        ...Array.from({ length: 25 }, (_, i) => ({
          member_number: 400 + i,
          full_name: `Runner ${i + 6}`,
          is_financial_member: i % 2 === 0,
          distance: i % 3 === 0 ? '5km' : '10km',
          current_handicap_5k: i % 3 === 0 ? '02:30' : undefined,
          current_handicap_10k: i % 3 !== 0 ? '08:00' : undefined,
          new_handicap: i % 3 === 0 ? '02:15' : '07:45',
          checked_in: true,
          finish_time: 1800000 + (i * 30000), // Staggered finish times
          finish_position: i + 6,
          handicap_status: i % 4 === 0 ? 'provisional' : 'official',
          points_earned: Math.max(1, 20 - (i + 5)),
          championship_points_10k: i % 3 !== 0 ? 15 + i : 0,
          championship_points_5k: i % 3 === 0 ? 12 + i : 0,
          races_participated_10k: i % 3 !== 0 ? 2 : 0,
          races_participated_5k: i % 3 === 0 ? 2 : 0,
        })),
      ] as Runner[],
    },
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Results view with large field of participants',
      },
    },
  },
};

export const OnlyFiveKm: Story = {
  args: {
    currentRace: {
      ...mockFinishedRace,
      runners: mockFinishedRace.runners.filter(r => r.distance === '5km'),
    },
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Results view with only 5km race results',
      },
    },
  },
};

export const OnlyTenKm: Story = {
  args: {
    currentRace: {
      ...mockFinishedRace,
      runners: mockFinishedRace.runners.filter(r => r.distance === '10km'),
    },
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Results view with only 10km race results',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    currentRace: mockFinishedRace,
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="min-h-screen bg-gray-900">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Results view in dark mode',
      },
    },
  },
};