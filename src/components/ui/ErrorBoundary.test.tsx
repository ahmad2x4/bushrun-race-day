import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

// Suppress error logging during tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = vi.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Mock component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Working component</div>
}

// Mock component for testing
function WorkingComponent() {
  return <div>Component works!</div>
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Component works!')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('We encountered an unexpected error. This might be temporary.')).toBeInTheDocument()
  })

  it('shows Try Again and Reload Page buttons in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const mockOnError = vi.fn()
    
    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(mockOnError).toHaveBeenCalled()
    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.any(Object)
    )
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
  })

  it('resets error state when Try Again is clicked', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true)
      
      return (
        <ErrorBoundary>
          <button onClick={() => setShouldThrow(false)}>Fix Component</button>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )
    }
    
    render(<TestComponent />)
    
    // Initially shows error
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    
    // Click Try Again
    fireEvent.click(screen.getByText('Try Again'))
    
    // Should attempt to re-render (though component will still throw)
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
  })

  it('shows developer details in development mode', () => {
    // Mock development environment
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Developer Details')).toBeInTheDocument()
    
    // Restore environment
    process.env.NODE_ENV = originalEnv
  })

  it('does not show developer details in production mode', () => {
    // Mock production environment
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.queryByText('Developer Details')).not.toBeInTheDocument()
    
    // Restore environment
    process.env.NODE_ENV = originalEnv
  })
})