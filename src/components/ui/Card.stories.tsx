import type { Meta, StoryObj } from '@storybook/react-vite';
import Card from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    shadow: {
      control: 'select', 
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-gray-600 dark:text-gray-400">
          This is a basic card with default padding and shadow.
        </p>
      </div>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="text-lg font-semibold mb-2">No Padding Card</h3>
        <p className="text-blue-700 dark:text-blue-300">
          This card has no padding - content fills the entire card.
        </p>
      </div>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: 'sm',
    children: (
      <div>
        <h3 className="text-sm font-semibold mb-1">Small Card</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Compact card with small padding.
        </p>
      </div>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    children: (
      <div>
        <h3 className="text-xl font-semibold mb-4">Large Card</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This card has large padding for more spacious layouts.
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Action Button
        </button>
      </div>
    ),
  },
};

export const NoShadow: Story = {
  args: {
    shadow: 'none',
    className: 'border border-gray-300 dark:border-gray-600',
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">No Shadow</h3>
        <p className="text-gray-600 dark:text-gray-400">
          This card has no shadow but uses a border instead.
        </p>
      </div>
    ),
  },
};

export const LargeShadow: Story = {
  args: {
    shadow: 'lg',
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Large Shadow</h3>
        <p className="text-gray-600 dark:text-gray-400">
          This card has a prominent shadow for emphasis.
        </p>
      </div>
    ),
  },
};

export const RaceResultCard: Story = {
  args: {
    children: (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold flex items-center gap-1">
              🥇
              <span className="text-lg">1</span>
            </div>
            <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
              #331
            </div>
            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              5km
            </span>
          </div>
        </div>
        
        <div className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          John Smith
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Finish Time</div>
            <div className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400">
              25:34.5
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Old Handicap</div>
            <div className="font-mono text-gray-600 dark:text-gray-400 font-medium">
              02:15
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">New Handicap</div>
            <div className="font-mono font-semibold text-green-600 dark:text-green-400">
              02:30
            </div>
          </div>
        </div>
      </div>
    ),
  },
  parameters: {
    layout: 'padded',
  },
};

export const StatsCard: Story = {
  args: {
    children: (
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600 mb-2">42</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Participants</div>
      </div>
    ),
  },
};