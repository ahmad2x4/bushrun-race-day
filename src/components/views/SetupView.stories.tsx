import type { Meta, StoryObj } from '@storybook/react-vite';
import SetupView from './SetupView';
import type { Race } from '../../types';

// Simple mock function for story actions
const mockFn = () => {};

const meta: Meta<typeof SetupView> = {
  title: 'Views/SetupView',
  component: SetupView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Race setup view allowing CSV upload, runner validation, and race configuration. The starting point for creating a new race.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentRace: {
      control: 'object',
      description: 'Current race state (null for new race)',
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
    currentRace: null,
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
  },
};

export const WithLoadedRace: Story = {
  args: {
    currentRace: {
      id: 'test-race',
      name: 'February 2024 BBR Handicap',
      date: '2024-02-04',
      status: 'setup',
      runners: [
        {
          member_number: 331,
          full_name: 'John Smith',
          is_financial_member: true,
          distance: '10km',
          current_handicap_10k: '09:30',
          checked_in: false,
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
      ],
      race_5k_active: false,
      race_10k_active: false,
    } as Race,
    setCurrentRace: mockFn,
    setCurrentView: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Setup view with race data loaded showing runner list and configuration options',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    currentRace: null,
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
        story: 'Setup view in dark mode',
      },
    },
  },
};