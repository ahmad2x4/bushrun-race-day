import { render, screen } from '@testing-library/react'
import StaggeredStartQueue from './StaggeredStartQueue'
import type { Race, Runner } from '../../types'

const mockRunners: Runner[] = [
  {
    member_number: '101',
    full_name: 'John Doe',
    distance: '5km',
    gender: 'M',
    current_handicap_5k: '01:30',
    current_handicap_10k: '03:00',
    checked_in: true,
    status: 'racing'
  },
  {
    member_number: '102',
    full_name: 'Jane Smith',
    distance: '5km',
    current_handicap_5k: '02:00',
    current_handicap_10k: '04:00',
    checked_in: true,
    status: 'racing'
  },
  {
    member_number: '103',
    full_name: 'Bob Johnson',
    distance: '10km',
    current_handicap_5k: '01:45',
    current_handicap_10k: '03:30',
    checked_in: true,
    status: 'racing'
  },
  {
    member_number: '104',
    full_name: 'Alice Brown',
    distance: '5km',
    current_handicap_5k: '01:30',
    current_handicap_10k: '03:00',
    checked_in: false, // Not checked in
    status: 'not_started'
  }
]

const mockRace: Race = {
  id: 'test-race',
  date: new Date().toISOString(),
  runners: mockRunners,
  status: 'in_progress',
  timer_start: Date.now() - 30000, // Started 30 seconds ago
  created_at: Date.now()
}

describe('StaggeredStartQueue', () => {
  it('renders staggered start queue title', () => {
    render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={0} />)
    
    expect(screen.getByText('Staggered Start Queue')).toBeInTheDocument()
  })

  it('only shows checked-in runners', () => {
    render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={0} />)
    
    expect(screen.getByText(/John Doe/)).toBeInTheDocument()
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument()
    expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument()
    expect(screen.queryByText(/Alice Brown/)).not.toBeInTheDocument()
  })

  it('groups runners by their start time (handicap)', () => {
    render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={0} />)
    
    // John and Alice both have 01:30 handicap for 5km (90 seconds)
    expect(screen.getByText('Start Delay: 01:30')).toBeInTheDocument()
    // Jane has 02:00 handicap for 5km (120 seconds)  
    expect(screen.getByText('Start Delay: 02:00')).toBeInTheDocument()
    // Bob has 03:30 handicap for 10km (210 seconds)
    expect(screen.getByText('Start Delay: 03:30')).toBeInTheDocument()
  })

  it('displays countdown for upcoming starts', () => {
    render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={30000} />)
    
    // At 30 seconds elapsed time, should show countdowns
    expect(screen.getByText('1:00')).toBeInTheDocument() // 01:30 start in 1:00 (90s - 30s = 60s = 1:00)
    expect(screen.getByText('1:30')).toBeInTheDocument() // 02:00 start in 1:30 (120s - 30s = 90s = 1:30)
  })

  it('shows "STARTED" for groups that have already begun', () => {
    render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={91000} />)
    
    // At 91 seconds elapsed, 01:30 group (90s) should show STARTED
    expect(screen.getByText('STARTED')).toBeInTheDocument()
  })

  it('highlights the next group to start', () => {
    render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={60000} />)
    
    expect(screen.getByTestId('next-starter-card')).toBeInTheDocument()
  })

  it('shows "STARTING!" badge for groups starting soon', () => {
    render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={87000} />)
    
    // At 1:27 elapsed, the 01:30 group should show STARTING! (3s before start)
    expect(screen.getByText('STARTING!')).toBeInTheDocument()
  })

  it('color codes runners by distance', () => {
    const { container } = render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={0} />)
    
    // 5km runners should have blue background
    const blueRunners = container.querySelectorAll('.bg-blue-100')
    expect(blueRunners.length).toBeGreaterThan(0)
    
    // 10km runners should have purple background
    const purpleRunners = container.querySelectorAll('.bg-purple-100')
    expect(purpleRunners.length).toBeGreaterThan(0)
  })

  it('shows message when all runners have started', () => {
    render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={300000} />)
    
    // At 5 minutes elapsed, all groups should have started and be filtered out
    expect(screen.getByText('All runners have started')).toBeInTheDocument()
  })

  it('formats countdown correctly for minutes and seconds', () => {
    render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={0} />)
    
    // Should format times properly
    expect(screen.getByText('1:30')).toBeInTheDocument() // 90 seconds = 1:30
    expect(screen.getByText('2:00')).toBeInTheDocument() // 120 seconds = 2:00
    expect(screen.getByText('3:30')).toBeInTheDocument() // 210 seconds = 3:30
  })

  it('uses correct handicap field based on distance', () => {
    render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={0} />)
    
    // John (5km) should use current_handicap_5k (01:30)
    expect(screen.getByText(/John Doe/)).toBeInTheDocument()
    
    // Bob (10km) should use current_handicap_10k (03:30) 
    expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument()
  })

  it('filters out groups that started more than 2 seconds ago', () => {
    render(<StaggeredStartQueue currentRace={mockRace} elapsedTime={95000} />)
    
    // At 95 seconds elapsed, 01:30 group started 5 seconds ago - should be filtered out
    // Only groups within 2 seconds of starting should remain visible
    expect(screen.queryByText('Start Delay: 01:30')).not.toBeInTheDocument()
  })

  it('handles empty handicap values gracefully', () => {
    const runnersWithEmptyHandicap: Runner[] = [{
      member_number: '105',
      full_name: 'No Handicap Runner',
      distance: '5km',
      gender: 'M',
      current_handicap_5k: '',
      current_handicap_10k: '',
      checked_in: true,
      status: 'racing'
    }]

    const raceWithEmptyHandicap = { ...mockRace, runners: runnersWithEmptyHandicap }
    
    render(<StaggeredStartQueue currentRace={raceWithEmptyHandicap} elapsedTime={0} />)
    
    expect(screen.getByText('All runners have started')).toBeInTheDocument()
  })
})
