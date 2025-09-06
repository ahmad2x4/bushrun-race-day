import type { Meta, StoryObj } from '@storybook/react-vite'
// Simple mock function for story actions
const mockAction = (name: string) => () => console.log(`Action: ${name}`)
import NumberPad from './NumberPad'

const meta: Meta<typeof NumberPad> = {
  title: 'UI Components/NumberPad',
  component: NumberPad,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Touch-optimized number pad component for mobile race day operations. Features large buttons for easy touch interaction and multiple action handlers.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disables all number pad interactions'
    },
    buttonText: {
      control: 'text',
      description: 'Text displayed on the action button'
    },
    onNumberClick: {
      description: 'Callback fired when a number button is clicked'
    },
    onBackspace: {
      description: 'Callback fired when backspace is pressed'
    },
    onClear: {
      description: 'Callback fired when clear is pressed'
    },
    onCheckin: {
      description: 'Callback fired when the main action button is pressed'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Common action handlers
const handlers = {
  onNumberClick: mockAction('number-clicked'),
  onBackspace: mockAction('backspace-pressed'),
  onClear: mockAction('clear-pressed'),
  onCheckin: mockAction('checkin-pressed')
}

export const Default: Story = {
  args: {
    ...handlers,
    disabled: false,
    buttonText: 'Check In Runner'
  },
  parameters: {
    docs: {
      description: {
        story: 'Default number pad ready for runner check-in. All interactions are enabled.'
      }
    }
  }
}

export const Disabled: Story = {
  args: {
    ...handlers,
    disabled: true,
    buttonText: 'Check In Runner'
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state - all buttons are non-interactive. Used when race is not active.'
      }
    }
  }
}

export const CustomButtonText: Story = {
  args: {
    ...handlers,
    disabled: false,
    buttonText: 'Record Finish Time'
  },
  parameters: {
    docs: {
      description: {
        story: 'Number pad with custom action button text for different use cases.'
      }
    }
  }
}

export const InteractionDemo: Story = {
  args: {
    onNumberClick: (digit: string) => {
      console.log(`Number clicked: ${digit}`)
      // In a real app, this would update the display
    },
    onBackspace: () => {
      console.log('Backspace pressed')
      // In a real app, this would remove the last digit
    },
    onClear: () => {
      console.log('Clear pressed') 
      // In a real app, this would clear the entire input
    },
    onCheckin: () => {
      console.log('Check-in action triggered')
      // In a real app, this would process the entered number
    },
    disabled: false,
    buttonText: 'Submit'
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with console logging. Check browser console to see button interactions.'
      }
    }
  }
}

export const MobileOptimized: Story = {
  args: {
    ...handlers,
    disabled: false,
    buttonText: '👆 Touch to Check In'
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Mobile view showing touch-optimized button sizes (72px minimum touch targets).'
      }
    }
  }
}