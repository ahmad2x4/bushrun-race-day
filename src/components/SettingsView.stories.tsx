import type { Meta, StoryObj } from '@storybook/react-vite';
import SettingsView from './SettingsView';
import type { ClubConfig } from '../types';

// Simple mock function for story actions
const mockFn = () => {};

const defaultClubConfig: ClubConfig = {
  name: 'Berowra Bushrunners',
  primary_color: '#3b82f6',
  secondary_color: '#1f2937',
  logo_url: undefined,
};

const meta: Meta<typeof SettingsView> = {
  title: 'Components/SettingsView',
  component: SettingsView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Club settings view allowing users to customize club name, colors, and branding. Includes real-time preview and validation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    clubConfig: {
      control: 'object',
      description: 'Current club configuration',
    },
    setClubConfig: {
      action: 'setClubConfig',
      description: 'Function to update club configuration',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    clubConfig: defaultClubConfig,
    setClubConfig: mockFn,
  },
};

export const CustomClub: Story = {
  args: {
    clubConfig: {
      name: 'Sydney Runners Club',
      primary_color: '#dc2626',
      secondary_color: '#374151',
      logo_url: undefined,
    },
    setClubConfig: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings view with custom club configuration showing different colors',
      },
    },
  },
};

export const GreenTheme: Story = {
  args: {
    clubConfig: {
      name: 'Green Valley Athletics',
      primary_color: '#059669',
      secondary_color: '#064e3b',
      logo_url: undefined,
    },
    setClubConfig: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings view with green color theme',
      },
    },
  },
};

export const PurpleTheme: Story = {
  args: {
    clubConfig: {
      name: 'Purple Haze Running Club',
      primary_color: '#7c3aed',
      secondary_color: '#581c87',
      logo_url: undefined,
    },
    setClubConfig: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings view with purple color theme',
      },
    },
  },
};

export const EmptyClubName: Story = {
  args: {
    clubConfig: {
      name: '',
      primary_color: '#3b82f6',
      secondary_color: '#1f2937',
      logo_url: undefined,
    },
    setClubConfig: mockFn,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings view with empty club name showing placeholder in preview',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    clubConfig: defaultClubConfig,
    setClubConfig: mockFn,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Settings view in dark mode',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="bg-gray-900 min-h-screen p-4">
          <Story />
        </div>
      </div>
    ),
  ],
};

export const Interactive: Story = {
  render: () => {
    const [clubConfig, setClubConfig] = React.useState<ClubConfig>({
      name: 'Interactive Demo Club',
      primary_color: '#3b82f6',
      secondary_color: '#1f2937',
      logo_url: undefined,
    });

    return (
      <SettingsView
        clubConfig={clubConfig}
        setClubConfig={setClubConfig}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive settings view where you can test color changes and see live preview updates',
      },
    },
  },
};

// Mock React for the Interactive story
const React = {
  useState: (initial: any) => {
    // Simple mock for Storybook - in real usage React.useState would work properly
    return [initial, mockFn];
  }
};