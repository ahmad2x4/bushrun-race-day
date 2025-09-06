import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Modal from './Modal'

const mockProps = {
  isOpen: true,
  onClose: vi.fn(),
  title: 'Test Modal',
  children: <div>Modal content</div>
}

describe('Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when isOpen is true', () => {
    render(<Modal {...mockProps} />)
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<Modal {...mockProps} isOpen={false} />)
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<Modal {...mockProps} />)
    
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking on backdrop', () => {
    render(<Modal {...mockProps} />)
    
    const backdrop = screen.getByText('Test Modal').closest('.fixed')
    fireEvent.click(backdrop!)
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside modal content', () => {
    render(<Modal {...mockProps} />)
    
    const modalContent = screen.getByText('Modal content')
    fireEvent.click(modalContent)
    
    expect(mockProps.onClose).not.toHaveBeenCalled()
  })

  it('renders title correctly', () => {
    render(<Modal {...mockProps} title="Custom Title" />)
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('renders children content correctly', () => {
    const customContent = (
      <div>
        <p>Paragraph 1</p>
        <button>Custom Button</button>
      </div>
    )
    
    render(<Modal {...mockProps} children={customContent} />)
    
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
    expect(screen.getByText('Custom Button')).toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    render(<Modal {...mockProps} />)
    
    const closeButton = screen.getByRole('button')
    expect(closeButton).toHaveAttribute('type', 'button')
    
    const srOnlyText = screen.getByText('Close modal')
    expect(srOnlyText).toHaveClass('sr-only')
  })

  it('applies correct CSS classes for styling', () => {
    const { container } = render(<Modal {...mockProps} />)
    
    const backdrop = container.querySelector('.fixed')
    expect(backdrop).toHaveClass('inset-0', 'z-50', 'bg-gray-900', 'bg-opacity-50')
    
    const modalContainer = container.querySelector('.bg-white')
    expect(modalContainer).toHaveClass('rounded-lg', 'shadow', 'dark:bg-gray-700')
  })

  it('has responsive design classes', () => {
    const { container } = render(<Modal {...mockProps} />)
    
    const contentWrapper = container.querySelector('.p-4')
    expect(contentWrapper).toHaveClass('w-full', 'max-w-md', 'max-h-full')
  })

  it('handles dark mode classes', () => {
    const { container } = render(<Modal {...mockProps} />)
    
    const header = container.querySelector('.border-b')
    expect(header).toHaveClass('dark:border-gray-600')
    
    const title = screen.getByText('Test Modal')
    expect(title).toHaveClass('dark:text-white')
  })

  it('prevents modal from closing when clicking modal content directly', () => {
    render(<Modal {...mockProps} />)
    
    const modalContent = screen.getByText('Test Modal').closest('.bg-white')
    fireEvent.click(modalContent!)
    
    expect(mockProps.onClose).not.toHaveBeenCalled()
  })
})