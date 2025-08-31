import type { Meta, StoryObj } from '@storybook/react-vite';
import ConfirmDialog from './ConfirmDialog';

// Simple mock function for story actions
const mockFn = () => {};

const meta: Meta<typeof ConfirmDialog> = {
  title: 'UI/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A confirmation dialog that wraps Modal with confirm/cancel actions. Used for destructive or important actions that require user confirmation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the dialog is visible',
    },
    title: {
      control: 'text',
      description: 'Dialog title text',
    },
    message: {
      control: 'text',
      description: 'Main confirmation message',
    },
    confirmText: {
      control: 'text',
      description: 'Text for the confirm button',
    },
    confirmButtonClass: {
      control: 'text',
      description: 'CSS classes for the confirm button styling',
    },
    onClose: mockFn,
    onConfirm: mockFn,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed with this action? This cannot be undone.',
    confirmText: 'Confirm',
    onClose: mockFn,
    onConfirm: mockFn,
  },
};

export const DeleteConfirmation: Story = {
  args: {
    isOpen: true,
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? This action cannot be undone and all associated data will be permanently removed.',
    confirmText: 'Delete',
    onClose: mockFn,
    onConfirm: mockFn,
  },
};

export const ResetRaceConfirmation: Story = {
  args: {
    isOpen: true,
    title: 'Reset Race',
    message: 'Are you sure you want to reset the current race? All race data including check-ins and finish times will be lost.',
    confirmText: 'Reset Race',
    onClose: mockFn,
    onConfirm: mockFn,
  },
};

export const CustomConfirmButton: Story = {
  args: {
    isOpen: true,
    title: 'Start Race',
    message: 'All checked-in runners are ready. Would you like to start the race timer?',
    confirmText: 'Start Race',
    confirmButtonClass: "text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800",
    onClose: mockFn,
    onConfirm: mockFn,
  },
};

export const LongMessage: Story = {
  args: {
    isOpen: true,
    title: 'Important Notice',
    message: 'This is a longer confirmation message that might span multiple lines. It demonstrates how the dialog handles longer content and ensures proper spacing and readability. The message can contain important details about the consequences of the action.',
    confirmText: 'I Understand',
    onClose: mockFn,
    onConfirm: mockFn,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    title: 'Hidden Dialog',
    message: 'This dialog is closed and should not be visible.',
    confirmText: 'OK',
    onClose: mockFn,
    onConfirm: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the dialog in closed state (not visible)',
      },
    },
  },
};