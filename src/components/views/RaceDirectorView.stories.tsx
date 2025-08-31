import type { Meta, StoryObj } from '@storybook/react-vite';
import RaceDirectorView from './RaceDirectorView';
import type { Race } from '../../types';

// Simple mock function for story actions
const mockFn = () => {};

const mockActiveRace: Race = {
  id: 'test-race',
  name: 'February 2024 BBR Handicap',
  date: '2024-02-04',
  status: 'active',
  start_time: Date.now() - 600000, // 10 minutes ago
  runners: [
    {
      member_number: 331,
      full_name: 'John Smith',
      is_financial_member: true,
      distance: '10km',
      current_handicap_10k: '09:30',
      checked_in: true,
      finish_time: 2534500, // Finished
      finish_position: 1,
      handicap_status: 'official',
      championship_points_10k: 45,
      championship_points_5k: 0,
      races_participated_10k: 3,
      races_participated_5k: 0,
    },
    {
      member_number: 200,
      full_name: 'Jane Doe',
      is_financial_member: true,
      distance: '5km',
      current_handicap_5k: '02:15',
      checked_in: true,
      finish_time: undefined, // Still running
      handicap_status: 'provisional',
      championship_points_10k: 0,
      championship_points_5k: 12,
      races_participated_10k: 0,
      races_participated_5k: 2,
    },
    {
      member_number: 150,
      full_name: 'Mike Johnson',
      is_financial_member: true,
      distance: '10km',
      current_handicap_10k: '08:45',
      checked_in: true,
      finish_time: undefined, // Still running
      handicap_status: 'official',
      championship_points_10k: 28,
      championship_points_5k: 0,
      races_participated_10k: 2,
      races_participated_5k: 0,
    },
  ],
  race_5k_active: true,
  race_10k_active: true,
};

const meta: Meta<typeof RaceDirectorView> = {
  title: 'Views/RaceDirectorView',
  component: RaceDirectorView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Race director interface with timer, runner grid, and finish recording capabilities. Optimized for tablet landscape use.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentRace: {
      control: 'object',
      description: 'Active race data',
    },
    setCurrentRace: {
      action: 'setCurrentRace',
      description: 'Function to update race state',
    },
    setCurrentView: {
      action: 'setCurrentView',
      description: 'Function to change application view',
    },
    raceTimer: {
      control: 'number',
      description: 'Current race timer in milliseconds',
    },
    setRaceTimer: {
      action: 'setRaceTimer',
      description: 'Function to update race timer',
    },
    isTimerRunning: {
      control: 'boolean',
      description: 'Whether race timer is currently running',
    },
    setIsTimerRunning: {
      action: 'setIsTimerRunning',
      description: 'Function to control timer state',
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

export const ActiveRace: Story = {
  args: {
    currentRace: mockActiveRace,
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
    raceTimer: 600000, // 10 minutes
    setRaceTimer: mockFn,
    isTimerRunning: true,
    setIsTimerRunning: mockFn,
  },
};

export const StaggeredStartQueue: Story = {
  args: {
    currentRace: {
      ...mockActiveRace,
      start_time: Date.now() - 60000, // 1 minute ago
    },
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
    raceTimer: 60000, // 1 minute
    setRaceTimer: mockFn,
    isTimerRunning: true,
    setIsTimerRunning: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Race director view during staggered start phase with countdown queue',
      },
    },
  },
};

export const TabletLandscape: Story = {
  args: {
    currentRace: mockActiveRace,
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
    raceTimer: 900000, // 15 minutes
    setRaceTimer: mockFn,
    isTimerRunning: true,
    setIsTimerRunning: mockFn,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Race director view optimized for tablet landscape orientation',
      },
    },
  },
};

export const RaceNotStarted: Story = {
  args: {
    currentRace: {
      ...mockActiveRace,
      status: 'checkin',
      start_time: undefined,
    },
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
    raceTimer: 0,
    setRaceTimer: mockFn,
    isTimerRunning: false,
    setIsTimerRunning: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Race director view before race start with start race button',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    currentRace: mockActiveRace,
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
    raceTimer: 600000,
    setRaceTimer: mockFn,
    isTimerRunning: true,
    setIsTimerRunning: mockFn,
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
        story: 'Race director view in dark mode',
      },
    },
  },
};