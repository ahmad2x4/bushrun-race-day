import type { Meta, StoryObj } from '@storybook/react-vite';
import LoadingView from './LoadingView';

const meta: Meta<typeof LoadingView> = {
  title: 'UI/LoadingView',
  component: LoadingView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A simple loading view with spinner and text. Used during database initialization and other loading states.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InContainer: Story = {
  decorators: [
    (Story) => (
      <div className="h-96 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Loading view inside a container with defined height',
      },
    },
  },
};

export const FullScreen: Story = {
  decorators: [
    (Story) => (
      <div className="h-screen bg-white dark:bg-gray-900">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Loading view taking full screen height',
      },
    },
  },
};

// Example with custom loading text (would require component modification)
export const CustomText: Story = {
  render: () => (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading race data...</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example with custom loading text (manual implementation)',
      },
    },
  },
};

export const LargeSpinner: Story = {
  render: () => (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Processing results...</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading view with larger spinner',
      },
    },
  },
};

export const ColorVariant: Story = {
  render: () => (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Saving changes...</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading view with green color variant',
      },
    },
  },
};