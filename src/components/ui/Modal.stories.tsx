import type { Meta, StoryObj } from '@storybook/react-vite';
import Modal from './Modal';

// Simple mock function for story actions
const mockFn = () => {};

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible modal dialog component with backdrop, header, and close functionality. Used as a base for other dialog components.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the modal is visible',
    },
    title: {
      control: 'text',
      description: 'Modal title text displayed in header',
    },
    onClose: mockFn,
    children: {
      control: false,
      description: 'Modal content (React nodes)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Modal Title',
    onClose: mockFn,
    children: (
      <div className="space-y-4">
        <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
          This is a basic modal with simple content. It demonstrates the modal structure with title, content area, and close functionality.
        </p>
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Action Button
          </button>
        </div>
      </div>
    ),
  },
};

export const WithForm: Story = {
  args: {
    isOpen: true,
    title: 'Settings',
    onClose: mockFn,
    children: (
      <form className="space-y-4">
        <div>
          <label htmlFor="club-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Club Name
          </label>
          <input
            type="text"
            id="club-name"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Enter club name"
            defaultValue="Berowra Bushrunners"
          />
        </div>
        <div>
          <label htmlFor="primary-color" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Primary Color
          </label>
          <input
            type="color"
            id="primary-color"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            defaultValue="#3b82f6"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    ),
  },
};

export const WithLongContent: Story = {
  args: {
    isOpen: true,
    title: 'Race Instructions',
    onClose: mockFn,
    children: (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          How to Participate
        </h4>
        <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
          <p>
            <strong>Check-in:</strong> Use the number pad to enter your member number and check in before the race starts.
          </p>
          <p>
            <strong>Start Time:</strong> Your start time is determined by your handicap. Lower handicaps start earlier.
          </p>
          <p>
            <strong>Finish:</strong> Cross the finish line and wait for the race director to record your time.
          </p>
          <p>
            <strong>Results:</strong> View your results and new handicap after all participants have finished.
          </p>
          <p>
            <strong>Points:</strong> If you have an official handicap, you'll earn championship points based on your finishing position.
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Make sure to start at your designated time to be eligible for championship points.
          </p>
        </div>
      </div>
    ),
  },
};

export const WithDataTable: Story = {
  args: {
    isOpen: true,
    title: 'Current Standings',
    onClose: mockFn,
    children: (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2">Position</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Points</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td className="px-4 py-2 font-medium">1st</td>
                <td className="px-4 py-2">John Smith</td>
                <td className="px-4 py-2">145</td>
              </tr>
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td className="px-4 py-2 font-medium">2nd</td>
                <td className="px-4 py-2">Jane Doe</td>
                <td className="px-4 py-2">132</td>
              </tr>
              <tr className="bg-white dark:bg-gray-800">
                <td className="px-4 py-2 font-medium">3rd</td>
                <td className="px-4 py-2">Mike Johnson</td>
                <td className="px-4 py-2">128</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    title: 'Hidden Modal',
    onClose: mockFn,
    children: (
      <p>This modal is closed and should not be visible.</p>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the modal in closed state (not visible)',
      },
    },
  },
};

export const EmptyContent: Story = {
  args: {
    isOpen: true,
    title: 'Empty Modal',
    onClose: mockFn,
    children: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with no content - shows just the title and close button',
      },
    },
  },
};