import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { ViewErrorFallback } from './ViewErrorFallback'
import Button from './Button'

const meta: Meta<typeof ErrorBoundary> = {
  title: 'UI/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

function WorkingComponent() {
  return (
    <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
      <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
        ✅ Working Component
      </h2>
      <p className="text-green-700 dark:text-green-300">
        This component is working normally and won't trigger an error boundary.
      </p>
    </div>
  )
}

function ErrorTestComponent() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (shouldThrow) {
    throw new Error('Test error triggered by user')
  }

  return (
    <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        This component can trigger an error to test the error boundary:
      </p>
      <Button 
        onClick={() => setShouldThrow(true)}
        variant="secondary"
        className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        Trigger Error
      </Button>
    </div>
  )
}

export const Default: Story = {
  args: {
    children: <WorkingComponent />,
  },
}

export const WithCustomFallback: Story = {
  args: {
    children: <WorkingComponent />,
    fallback: (
      <div className="p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
          Custom Error Fallback
        </h2>
        <p className="text-yellow-700 dark:text-yellow-300">
          This is a custom error fallback UI.
        </p>
      </div>
    ),
  },
}

export const WithErrorTest: Story = {
  args: {
    children: (
      <div className="p-8 space-y-4">
        <WorkingComponent />
        <ErrorTestComponent />
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the "Trigger Error" button to test the error boundary functionality.',
      },
    },
  },
}

export const WithViewFallback: Story = {
  args: {
    children: <ErrorTestComponent />,
    fallback: (
      <ViewErrorFallback 
        viewName="Test View" 
        onNavigateHome={() => alert('Navigate home clicked!')}
        onRetry={() => alert('Retry clicked!')}
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how error boundaries work with view-specific error fallbacks.',
      },
    },
  },
}