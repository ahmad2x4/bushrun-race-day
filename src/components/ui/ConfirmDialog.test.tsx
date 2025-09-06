import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import ConfirmDialog from './ConfirmDialog'

const mockProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: 'Confirm Action',
  message: 'Are you sure you want to continue?',
  confirmText: 'Yes, Continue'
}

describe('ConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when isOpen is true', () => {
    render(<ConfirmDialog {...mockProps} />)
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to continue?')).toBeInTheDocument()
    expect(screen.getByText('Yes, Continue')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<ConfirmDialog {...mockProps} isOpen={false} />)
    
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
    expect(screen.queryByText('Are you sure you want to continue?')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...mockProps} />)
    
    fireEvent.click(screen.getByText('Yes, Continue'))
    
    expect(mockProps.onConfirm).toHaveBeenCalledTimes(1)
    expect(mockProps.onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when cancel button is clicked', () => {
    render(<ConfirmDialog {...mockProps} />)
    
    fireEvent.click(screen.getByText('Cancel'))
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
    expect(mockProps.onConfirm).not.toHaveBeenCalled()
  })

  it('calls onClose when modal close button is clicked', () => {
    render(<ConfirmDialog {...mockProps} />)
    
    // Find the X close button in the modal header
    const closeButton = screen.getByRole('button', { name: /close modal/i })
    fireEvent.click(closeButton)
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
    expect(mockProps.onConfirm).not.toHaveBeenCalled()
  })

  it('applies custom confirm button class when provided', () => {
    const customClass = 'bg-green-600 hover:bg-green-700'
    render(<ConfirmDialog {...mockProps} confirmButtonClass={customClass} />)
    
    const confirmButton = screen.getByText('Yes, Continue')
    expect(confirmButton).toHaveClass('bg-green-600', 'hover:bg-green-700')
  })

  it('applies default confirm button class when not provided', () => {
    render(<ConfirmDialog {...mockProps} />)
    
    const confirmButton = screen.getByText('Yes, Continue')
    expect(confirmButton).toHaveClass('bg-red-700', 'hover:bg-red-800')
  })

  it('renders custom title and message', () => {
    const customProps = {
      ...mockProps,
      title: 'Delete Item',
      message: 'This action cannot be undone. Are you sure?'
    }
    
    render(<ConfirmDialog {...customProps} />)
    
    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone. Are you sure?')).toBeInTheDocument()
  })

  it('renders custom confirm text', () => {
    render(<ConfirmDialog {...mockProps} confirmText="Delete Forever" />)
    
    expect(screen.getByText('Delete Forever')).toBeInTheDocument()
  })

  it('has proper button structure and styling', () => {
    render(<ConfirmDialog {...mockProps} />)
    
    const confirmButton = screen.getByText('Yes, Continue')
    const cancelButton = screen.getByText('Cancel')
    
    expect(confirmButton).toHaveAttribute('type', 'button')
    expect(cancelButton).toHaveAttribute('type', 'button')
    
    expect(confirmButton).toHaveClass('font-medium', 'rounded-lg', 'text-sm')
    expect(cancelButton).toHaveClass('font-medium', 'rounded-lg', 'text-sm')
  })

  it('maintains button order - confirm first, cancel second', () => {
    render(<ConfirmDialog {...mockProps} />)
    
    const buttons = screen.getAllByRole('button')
    const actionButtons = buttons.filter(btn => 
      btn.textContent === 'Yes, Continue' || btn.textContent === 'Cancel'
    )
    
    expect(actionButtons[0]).toHaveTextContent('Yes, Continue')
    expect(actionButtons[1]).toHaveTextContent('Cancel')
  })

  it('supports dark mode styling', () => {
    render(<ConfirmDialog {...mockProps} />)
    
    const message = screen.getByText('Are you sure you want to continue?')
    expect(message).toHaveClass('dark:text-gray-400')
    
    const cancelButton = screen.getByText('Cancel')
    expect(cancelButton).toHaveClass('dark:bg-gray-800', 'dark:text-gray-400')
  })

  it('closes modal when clicking backdrop', () => {
    render(<ConfirmDialog {...mockProps} />)
    
    const backdrop = screen.getByText('Confirm Action').closest('.fixed')
    fireEvent.click(backdrop!)
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
  })
})