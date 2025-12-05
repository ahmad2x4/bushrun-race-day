import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import NewMemberDialog from './NewMemberDialog'

const meta: Meta<typeof NewMemberDialog> = {
  title: 'Forms/NewMemberDialog',
  component: NewMemberDialog,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof NewMemberDialog>

// Interactive wrapper component to manage dialog state
function DialogWrapper() {
  const [isOpen, setIsOpen] = useState(true)
  const [assignedNumber, setAssignedNumber] = useState<number | null>(null)

  const handleRegister = async (name: string, distance: '5km' | '10km'): Promise<number> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simulate assigning a temp number
    const tempNumber = 999 - Math.floor(Math.random() * 10)
    console.log(`Registering ${name} for ${distance}`)
    setAssignedNumber(tempNumber)
    return tempNumber
  }

  const handleClose = () => {
    setIsOpen(false)
    setAssignedNumber(null)
    // Reopen after a short delay for Storybook interaction
    setTimeout(() => setIsOpen(true), 500)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          New Member Registration Dialog
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This dialog appears when the race director clicks the "New" button on the check-in screen
          to register a new member on race day.
        </p>
        {assignedNumber && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              Last assigned number: <strong className="text-lg">{assignedNumber}</strong>
            </p>
          </div>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="btn-primary px-6 py-3 rounded-lg font-medium"
        >
          Open Dialog
        </button>
      </div>

      <NewMemberDialog
        isOpen={isOpen}
        onClose={handleClose}
        onRegister={handleRegister}
      />
    </div>
  )
}

// Default story showing the dialog in action
export const Default: Story = {
  render: () => <DialogWrapper />,
}

// Story showing the dialog closed
export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    onRegister: async () => 999,
  },
  render: (args) => (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Dialog Closed State
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          The dialog is not visible when closed.
        </p>
      </div>
      <NewMemberDialog {...args} />
    </div>
  ),
}

// Story with dark mode
export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <DialogWrapper />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
}

// Story demonstrating the registration form
export const RegistrationForm: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Close clicked'),
    onRegister: async (name: string, distance: '5km' | '10km') => {
      console.log('Registering:', name, 'for', distance)
      await new Promise(resolve => setTimeout(resolve, 1500))
      return 998
    },
  },
  render: (args) => (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex items-center justify-center">
      <NewMemberDialog {...args} />
    </div>
  ),
}

// Story showing validation error
export const WithValidationError: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onRegister: async (name: string) => {
      if (!name.trim()) {
        throw new Error('Please enter a name')
      }
      return 997
    },
  },
  render: (args) => (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex items-center justify-center">
      <NewMemberDialog {...args} />
      <div className="absolute top-8 left-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Try it:</strong> Click "Register" without entering a name to see the validation error.
        </p>
      </div>
    </div>
  ),
}
