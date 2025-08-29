import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import Input from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    fullWidth: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    },
  },
  args: { onChange: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Member Number',
    placeholder: 'e.g., 331',
    hint: 'Your unique member identification number',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'your.email@example.com',
    error: 'Please enter a valid email address',
    value: 'invalid-email',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
  },
};

export const Number: Story = {
  args: {
    label: 'Age',
    type: 'number',
    placeholder: '25',
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Race Name',
    fullWidth: true,
    placeholder: 'Bushrun Championship 2024',
  },
  parameters: {
    layout: 'padded',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Field',
    value: 'This field is disabled',
    disabled: true,
  },
};

export const FormExample: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <Input
        label="Member Number"
        type="number"
        placeholder="331"
        hint="Your unique member ID"
      />
      <Input
        label="Full Name"
        placeholder="John Smith"
      />
      <Input
        label="Email"
        type="email"
        placeholder="john.smith@example.com"
      />
      <Input
        label="Distance"
        value="5km"
        disabled
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Accessibility-focused stories
export const RequiredField: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter full name',
    required: true,
    hint: 'This field is required for race registration',
  },
  parameters: {
    docs: {
      description: {
        story: 'Required input field with proper aria-required attribute and visual indicator.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    label: 'Finish Time',
    placeholder: 'MM:SS',
    error: 'Please enter time in MM:SS format (e.g., 25:30)',
    value: 'invalid',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input with error state using aria-invalid for screen readers.',
      },
    },
  },
};

export const SearchInput: Story = {
  args: {
    type: 'search',
    label: 'Search Runners',
    placeholder: 'Search by member number or name...',
    hint: 'Use member number for exact match',
  },
  parameters: {
    docs: {
      description: {
        story: 'Search input with appropriate type and clear labeling.',
      },
    },
  },
};

export const FieldGroup: Story = {
  render: () => (
    <fieldset className="w-96 space-y-4 border border-gray-300 dark:border-gray-600 p-4 rounded">
      <legend className="text-sm font-medium text-gray-900 dark:text-white px-2">
        Finish Time Entry
      </legend>
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Minutes"
          type="number"
          min={0}
          max={99}
          placeholder="25"
          hint="0-99"
        />
        <Input
          label="Seconds"
          type="number"
          min={0}
          max={59}
          placeholder="30"
          hint="0-59"
        />
      </div>
    </fieldset>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Related input fields grouped with fieldset and legend for screen readers.',
      },
    },
  },
};