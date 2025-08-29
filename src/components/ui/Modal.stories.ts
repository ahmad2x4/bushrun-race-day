import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
  },
  args: { 
    onClose: fn(),
    title: 'Modal Title',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Default Modal',
    children: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          This is a basic modal with some content.
        </p>
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="primary">Confirm</Button>
          <Button variant="secondary">Cancel</Button>
        </div>
      </div>
    ),
  },
};

export const WithForm: Story = {
  args: {
    isOpen: true,
    title: 'Add New Runner',
    children: (
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Member Number
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            placeholder="331"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Distance
          </label>
          <select className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
            <option value="5km">5km</option>
            <option value="10km">10km</option>
          </select>
        </div>
        <div className="flex gap-2 pt-4 border-t">
          <Button type="submit" variant="primary">Add Runner</Button>
          <Button type="button" variant="secondary">Cancel</Button>
        </div>
      </form>
    ),
  },
};

export const Warning: Story = {
  args: {
    isOpen: true,
    title: '⚠️ Warning',
    children: (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Are you sure?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This action cannot be undone. The race data will be permanently deleted.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="danger">Delete</Button>
          <Button variant="secondary">Keep</Button>
        </div>
      </div>
    ),
  },
};

export const Success: Story = {
  args: {
    isOpen: true,
    title: '✅ Success',
    children: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-green-600 dark:text-green-400">✅</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Race Completed Successfully!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            All runners have finished and results have been calculated.
          </p>
          <Button variant="success" fullWidth>View Results</Button>
        </div>
      </div>
    ),
  },
};

// Interactive example that shows opening/closing
export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)}
          title="Interactive Modal"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              This modal can be opened and closed interactively.
            </p>
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => setIsOpen(false)} variant="primary">
                Close Modal
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
};