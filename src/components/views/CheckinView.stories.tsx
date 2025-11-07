import type { Meta, StoryObj } from '@storybook/react-vite';
import CheckinView from './CheckinView';
import type { Race, ClubConfig } from '../../types';

// Simple mock function for story actions
const mockFn = () => {};

const mockClubConfig: ClubConfig = {
  name: 'Berowra Bushrunners',
  primary_color: '#2563eb',
  enable_time_adjustment: true,
  audio_enabled: true,
  audio_volume: 0.5,
};

const mockRace: Race = {
  id: 'test-race',
  name: 'February 2024 BBR Handicap',
  date: '2024-02-04',
  status: 'checkin',
  runners: [
    {
      member_number: 331,
      full_name: 'John Smith',
      is_financial_member: true,
      distance: '10km',
      current_handicap_10k: '09:30',
      checked_in: true,
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
      checked_in: false,
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
      checked_in: false,
      handicap_status: 'official',
      championship_points_10k: 28,
      championship_points_5k: 0,
      races_participated_10k: 2,
      races_participated_5k: 0,
    },
  ],
  race_5k_active: false,
  race_10k_active: false,
};

const meta: Meta<typeof CheckinView> = {
  title: 'Views/CheckinView',
  component: CheckinView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Runner check-in view with number pad interface for self-service registration before race start.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentRace: {
      control: 'object',
      description: 'Race data with runner information',
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
    currentRace: mockRace,
    setCurrentRace: mockFn,
    clubConfig: mockClubConfig,
  },
};

export const MobilePortrait: Story = {
  args: {
    currentRace: mockRace,
    setCurrentRace: mockFn,
    clubConfig: mockClubConfig,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Check-in view optimized for mobile portrait orientation',
      },
    },
  },
};

export const TabletPortrait: Story = {
  args: {
    currentRace: mockRace,
    setCurrentRace: mockFn,
    clubConfig: mockClubConfig,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Check-in view optimized for tablet portrait orientation with larger touch targets',
      },
    },
  },
};

export const AllCheckedIn: Story = {
  args: {
    currentRace: {
      ...mockRace,
      runners: mockRace.runners.map(r => ({ ...r, checked_in: true })),
    },
    setCurrentRace: mockFn,
    clubConfig: mockClubConfig,
  },
  parameters: {
    docs: {
      description: {
        story: 'Check-in view when all runners have already checked in',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    currentRace: mockRace,
    setCurrentRace: mockFn,
    clubConfig: mockClubConfig,
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
        story: 'Check-in view in dark mode',
      },
    },
  },
};