import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'success', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    fullWidth: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
  args: { onClick: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
  parameters: {
    layout: 'padded',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-x-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="success">Success</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      <div className="space-x-2">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className="space-x-2">
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Accessibility-focused stories
export const WithAriaLabel: Story = {
  args: {
    'aria-label': 'Add new runner to the race',
    children: '+',
    variant: 'primary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with aria-label for screen readers when text content is not descriptive enough.',
      },
    },
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <span aria-hidden="true">📄</span>
        Export Results
      </>
    ),
    variant: 'secondary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with icon uses aria-hidden to prevent screen readers from announcing decorative content.',
      },
    },
  },
};

export const TouchTarget: Story = {
  args: {
    children: 'Touch Target',
    style: { minHeight: '44px', minWidth: '44px' }, // Ensures 44px minimum touch target
    variant: 'primary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button meets WCAG 2.1 minimum touch target size of 44px.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const FocusIndicator: Story = {
  args: {
    children: 'Focus me with Tab',
    variant: 'primary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button should have visible focus indicator for keyboard navigation. Try tabbing to this button.',
      },
    },
  },
};