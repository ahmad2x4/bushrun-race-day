import type { Meta, StoryObj } from '@storybook/react-vite';
import ExportSection from './ExportSection';
import type { Race, Runner } from '../../types';

// Mock sample data for stories
const mockRace: Race = {
  id: 'test-race',
  name: 'February 2024 BBR Handicap',
  date: '2024-02-04',
  status: 'finished',
  start_time: Date.now() - 3600000,
  runners: [
    {
      member_number: 331,
      full_name: 'John Smith',
      is_financial_member: true,
      distance: '10km',
      current_handicap_10k: '09:30',
      new_handicap: '09:45',
      checked_in: true,
      finish_time: 2534500,
      finish_position: 1,
      handicap_status: 'official',
      points_earned: 20,
    },
    {
      member_number: 200,
      full_name: 'Jane Doe',
      is_financial_member: true,
      distance: '5km',
      current_handicap_5k: '02:15',
      new_handicap: '02:30',
      checked_in: true,
      finish_time: 1825300,
      finish_position: 2,
      handicap_status: 'official',
      points_earned: 15,
    },
  ] as Runner[],
  race_5k_active: false,
  race_10k_active: false,
};

const meta: Meta<typeof ExportSection> = {
  title: 'Race/ExportSection',
  component: ExportSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Export section providing CSV download functionality for race results and next race handicaps.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentRace: {
      control: 'object',
      description: 'Race data to export',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentRace: mockRace,
  },
};

export const LongRaceName: Story = {
  args: {
    currentRace: {
      ...mockRace,
      name: 'February 2024 Berowra Bushrunners Monthly Championship Handicap Race',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Export section with a longer race name',
      },
    },
  },
};

export const EmptyRace: Story = {
  args: {
    currentRace: {
      ...mockRace,
      runners: [],
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Export section with no runners (buttons still functional)',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    currentRace: mockRace,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Export section in dark mode',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="bg-gray-900 min-h-screen p-4">
          <Story />
        </div>
      </div>
    ),
  ],
};