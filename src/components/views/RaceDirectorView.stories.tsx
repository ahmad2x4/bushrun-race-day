import type { Meta, StoryObj } from '@storybook/react-vite';
import RaceDirectorView from './RaceDirectorView';
import type { Race, ClubConfig } from '../../types';
import { WakeLockProvider } from '../../contexts/WakeLockContext';
import { RaceProvider } from '../../contexts/RaceContext';

// Simple mock function for story actions
const mockFn = () => {};

const mockClubConfig: ClubConfig = {
  name: 'Berowra Bushrunners',
  primary_color: '#2563eb',
  enable_time_adjustment: true,
  audio_enabled: true,
  audio_volume: 0.5,
};

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
      is_official_10k: true,
    },
    {
      member_number: 200,
      full_name: 'Jane Doe',
      is_financial_member: true,
      distance: '5km',
      current_handicap_5k: '02:15',
      checked_in: true,
      finish_time: undefined, // Still running
      is_official_5k: false,
    },
    {
      member_number: 150,
      full_name: 'Mike Johnson',
      is_financial_member: true,
      distance: '10km',
      current_handicap_10k: '08:45',
      checked_in: true,
      finish_time: undefined, // Still running
      is_official_10k: true,
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
    elapsedTime: {
      control: 'number',
      description: 'Current race elapsed time in milliseconds',
    },
    isRaceRunning: {
      control: 'boolean',
      description: 'Whether race is currently running',
    },
    startRace: {
      action: 'startRace',
      description: 'Function to start the race',
    },
    stopRace: {
      action: 'stopRace',
      description: 'Function to stop the race',
    },
    isTestingMode: {
      control: 'boolean',
      description: 'Whether testing mode is enabled',
    },
    setIsTestingMode: {
      action: 'setIsTestingMode',
      description: 'Function to toggle testing mode',
    },
  },
  decorators: [
    (Story) => (
      <RaceProvider>
        <WakeLockProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Story />
          </div>
        </WakeLockProvider>
      </RaceProvider>
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
    clubConfig: mockClubConfig,
    elapsedTime: 600000, // 10 minutes
    isRaceRunning: true,
    startRace: mockFn,
    stopRace: mockFn,
    isTestingMode: false,
    setIsTestingMode: mockFn,
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
    clubConfig: mockClubConfig,
    elapsedTime: 60000, // 1 minute
    isRaceRunning: true,
    startRace: mockFn,
    stopRace: mockFn,
    isTestingMode: false,
    setIsTestingMode: mockFn,
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
    clubConfig: mockClubConfig,
    elapsedTime: 900000, // 15 minutes
    isRaceRunning: true,
    startRace: mockFn,
    stopRace: mockFn,
    isTestingMode: false,
    setIsTestingMode: mockFn,
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
    clubConfig: mockClubConfig,
    elapsedTime: 0,
    isRaceRunning: false,
    startRace: mockFn,
    stopRace: mockFn,
    isTestingMode: false,
    setIsTestingMode: mockFn,
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
    clubConfig: mockClubConfig,
    elapsedTime: 600000,
    isRaceRunning: true,
    startRace: mockFn,
    stopRace: mockFn,
    isTestingMode: false,
    setIsTestingMode: mockFn,
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