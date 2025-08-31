import type { Meta, StoryObj } from '@storybook/react-vite';
import Input from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible input component with label, error states, hints, and full width options. Supports all standard HTML input attributes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Input label text',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    hint: {
      control: 'text',
      description: 'Helpful hint text (hidden when error is present)',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether input should take full width',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'HTML input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether input is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether input is required',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Club Name',
    placeholder: 'Enter club name...',
  },
};

export const WithError: Story = {
  args: {
    label: 'Member Number',
    placeholder: 'Enter member number',
    error: 'Member number is required',
    defaultValue: '',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'name@example.com',
    hint: 'Used for race notifications and updates',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    hint: 'Minimum 8 characters required',
  },
};

export const Number: Story = {
  args: {
    label: 'Handicap Time (seconds)',
    type: 'number',
    placeholder: '135',
    min: 0,
    max: 3600,
    hint: 'Enter handicap in seconds (e.g., 135 for 2:15)',
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Race Description',
    placeholder: 'Enter race description...',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Disabled: Story = {
  args: {
    label: 'Race Status',
    defaultValue: 'In Progress',
    disabled: true,
    hint: 'This field is automatically updated',
  },
};

export const Required: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
    hint: 'This field is required for registration',
  },
};

export const NoLabel: Story = {
  args: {
    placeholder: 'Search runners...',
    type: 'search',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input without a label - useful for search fields or inline forms',
      },
    },
  },
};

export const WithCustomId: Story = {
  args: {
    label: 'Custom Field',
    id: 'custom-input-id',
    placeholder: 'Custom ID example',
    hint: 'This input has a custom ID attribute',
  },
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4">
      <Input
        label="Club Name"
        defaultValue="Berowra Bushrunners"
        fullWidth
        required
      />
      <Input
        label="Primary Color"
        type="color"
        defaultValue="#3b82f6"
        hint="Choose your club's primary brand color"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="admin@club.com"
          required
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="+61 400 123 456"
        />
      </div>
      <Input
        label="Website"
        type="url"
        placeholder="https://club.com"
        hint="Optional club website"
      />
    </form>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example showing multiple inputs in a form layout with various types and configurations',
      },
    },
  },
};