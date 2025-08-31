import type { Meta, StoryObj } from '@storybook/react-vite';
import ResultsTable from './ResultsTable';
import type { Race, Runner } from '../../types';

// Simple mock function for story actions
const mockFn = () => {};

// Mock sample data for stories
const mockRace: Race = {
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
    },
    {
      member_number: 275,
      full_name: 'Sarah Wilson',
      is_financial_member: false,
      distance: '5km',
      current_handicap_5k: '03:30',
      new_handicap: '03:15',
      checked_in: true,
      status: 'dnf',
      handicap_status: 'provisional',
      points_earned: 1,
    },
  ] as Runner[],
  race_5k_active: false,
  race_10k_active: false,
};

const meta: Meta<typeof ResultsTable> = {
  title: 'Race/ResultsTable',
  component: ResultsTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Results table showing race finishers with sorting, filtering, and inline time editing capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentRace: {
      control: 'object',
      description: 'Race data with runners and results',
    },
    setCurrentRace: {
      action: 'setCurrentRace',
      description: 'Function to update race data',
    },
    editingRunnerTime: {
      control: 'object',
      description: 'Currently editing runner time state',
    },
    setEditingRunnerTime: {
      action: 'setEditingRunnerTime',
      description: 'Function to set editing state',
    },
    handleTimeAdjustment: {
      action: 'handleTimeAdjustment',
      description: 'Function to handle time adjustments',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentRace: mockRace,
    setCurrentRace: mockFn,
    editingRunnerTime: null,
    setEditingRunnerTime: mockFn,
    handleTimeAdjustment: mockFn,
  },
};

export const WithEditingState: Story = {
  args: {
    currentRace: mockRace,
    setCurrentRace: mockFn,
    editingRunnerTime: { runnerId: 331, currentTime: '42:14.5' },
    setEditingRunnerTime: mockFn,
    handleTimeAdjustment: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Results table with a runner time in editing mode',
      },
    },
  },
};

export const EmptyResults: Story = {
  args: {
    currentRace: {
      ...mockRace,
      runners: mockRace.runners.map(r => ({ ...r, finish_time: undefined, finish_position: undefined, status: undefined })),
    },
    setCurrentRace: mockFn,
    editingRunnerTime: null,
    setEditingRunnerTime: mockFn,
    handleTimeAdjustment: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Results table with no finished runners',
      },
    },
  },
};

export const LargeResultsSet: Story = {
  args: {
    currentRace: {
      ...mockRace,
      runners: [
        ...mockRace.runners,
        ...Array.from({ length: 20 }, (_, i) => ({
          member_number: 400 + i,
          full_name: `Runner ${i + 5}`,
          is_financial_member: i % 2 === 0,
          distance: i % 3 === 0 ? '5km' : '10km',
          current_handicap_5k: i % 3 === 0 ? '02:30' : undefined,
          current_handicap_10k: i % 3 !== 0 ? '08:00' : undefined,
          new_handicap: i % 3 === 0 ? '02:15' : '07:45',
          checked_in: true,
          finish_time: 1800000 + (i * 30000), // Staggered finish times
          finish_position: i + 5,
          handicap_status: i % 4 === 0 ? 'provisional' : 'official',
          points_earned: Math.max(1, 20 - (i + 4)),
        })),
      ] as Runner[],
    },
    setCurrentRace: mockFn,
    editingRunnerTime: null,
    setEditingRunnerTime: mockFn,
    handleTimeAdjustment: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Results table with many participants demonstrating scrolling and performance',
      },
    },
  },
};