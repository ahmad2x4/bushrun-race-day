import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import NumberPad from './NumberPad'

const mockProps = {
  onNumberClick: vi.fn(),
  onBackspace: vi.fn(),
  onClear: vi.fn(),
  onCheckin: vi.fn(),
  disabled: false,
  buttonText: 'Check In Runner'
}

describe('NumberPad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all number buttons from 0-9', () => {
    render(<NumberPad {...mockProps} />)
    
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument()
    }
  })

  it('renders control buttons (Clear, Backspace)', () => {
    render(<NumberPad {...mockProps} />)
    
    expect(screen.getByText('Clear')).toBeInTheDocument()
    expect(screen.getByText('⌫')).toBeInTheDocument()
  })

  it('renders check-in button with default text', () => {
    render(<NumberPad {...mockProps} />)
    
    expect(screen.getByText('Check In Runner')).toBeInTheDocument()
  })

  it('renders check-in button with custom text', () => {
    render(<NumberPad {...mockProps} buttonText="Custom Button" />)
    
    expect(screen.getByText('Custom Button')).toBeInTheDocument()
  })

  it('calls onNumberClick when number buttons are clicked', () => {
    render(<NumberPad {...mockProps} />)
    
    fireEvent.click(screen.getByText('5'))
    expect(mockProps.onNumberClick).toHaveBeenCalledWith('5')
    
    fireEvent.click(screen.getByText('0'))
    expect(mockProps.onNumberClick).toHaveBeenCalledWith('0')
    
    expect(mockProps.onNumberClick).toHaveBeenCalledTimes(2)
  })

  it('calls onClear when Clear button is clicked', () => {
    render(<NumberPad {...mockProps} />)
    
    fireEvent.click(screen.getByText('Clear'))
    expect(mockProps.onClear).toHaveBeenCalledTimes(1)
  })

  it('calls onBackspace when backspace button is clicked', () => {
    render(<NumberPad {...mockProps} />)
    
    fireEvent.click(screen.getByText('⌫'))
    expect(mockProps.onBackspace).toHaveBeenCalledTimes(1)
  })

  it('calls onCheckin when check-in button is clicked and not disabled', () => {
    render(<NumberPad {...mockProps} />)
    
    fireEvent.click(screen.getByText('Check In Runner'))
    expect(mockProps.onCheckin).toHaveBeenCalledTimes(1)
  })

  it('disables check-in button when disabled prop is true', () => {
    render(<NumberPad {...mockProps} disabled={true} />)
    
    const checkinButton = screen.getByText('Check In Runner')
    expect(checkinButton).toBeDisabled()
    
    fireEvent.click(checkinButton)
    expect(mockProps.onCheckin).not.toHaveBeenCalled()
  })

  it('applies disabled styles when disabled prop is true', () => {
    render(<NumberPad {...mockProps} disabled={true} />)
    
    const checkinButton = screen.getByText('Check In Runner')
    expect(checkinButton).toHaveClass('cursor-not-allowed')
  })

  it('does not disable number and control buttons when check-in is disabled', () => {
    render(<NumberPad {...mockProps} disabled={true} />)
    
    const numberButton = screen.getByText('1')
    const clearButton = screen.getByText('Clear')
    const backspaceButton = screen.getByText('⌫')
    
    expect(numberButton).not.toBeDisabled()
    expect(clearButton).not.toBeDisabled()
    expect(backspaceButton).not.toBeDisabled()
    
    fireEvent.click(numberButton)
    fireEvent.click(clearButton)
    fireEvent.click(backspaceButton)
    
    expect(mockProps.onNumberClick).toHaveBeenCalledWith('1')
    expect(mockProps.onClear).toHaveBeenCalledTimes(1)
    expect(mockProps.onBackspace).toHaveBeenCalledTimes(1)
  })

  it('has proper grid layout structure', () => {
    const { container } = render(<NumberPad {...mockProps} />)

    // Should have main container with responsive padding
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow')

    // Should have grid containers
    const grids = container.querySelectorAll('.grid')
    expect(grids).toHaveLength(2) // Number grid + bottom row grid
  })

  it('applies correct CSS classes for touch optimization', () => {
    render(<NumberPad {...mockProps} />)

    const numberButton = screen.getByText('1')
    expect(numberButton).toHaveClass('btn-touch-lg')

    const checkinButton = screen.getByText('Check In Runner')
    expect(checkinButton).toHaveClass('w-full')
    // Check-in button no longer uses btn-touch-lg, has custom responsive height
    expect(checkinButton).toHaveClass('h-14', 'sm:h-16', 'md:h-18')
  })

  it('has correct button colors for different actions', () => {
    render(<NumberPad {...mockProps} />)
    
    // Number buttons should have gray background
    const numberButton = screen.getByText('1')
    expect(numberButton).toHaveClass('bg-gray-100', 'hover:bg-gray-200')
    
    // Clear button should have red background
    const clearButton = screen.getByText('Clear')
    expect(clearButton).toHaveClass('bg-red-100', 'hover:bg-red-200')
    
    // Backspace button should have yellow background
    const backspaceButton = screen.getByText('⌫')
    expect(backspaceButton).toHaveClass('bg-yellow-100', 'hover:bg-yellow-200')
  })

  it('supports keyboard accessibility with focus rings', () => {
    render(<NumberPad {...mockProps} />)
    
    const numberButton = screen.getByText('1')
    expect(numberButton).toHaveClass('focus:outline-none', 'focus:ring-4', 'focus:ring-blue-200')
  })
})