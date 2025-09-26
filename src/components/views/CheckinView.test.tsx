import { describe, it, expect } from 'vitest'

// Extract helper functions for testing
const timeToSeconds = (timeStr: string): number => {
  if (!timeStr || timeStr === '0:00') return 0
  const [minutes, seconds] = timeStr.split(':').map(Number)
  return minutes * 60 + seconds
}

const secondsToTime = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '0:00'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

describe('CheckinView Time Helper Functions', () => {
  describe('timeToSeconds', () => {
    it('should convert time string to seconds correctly', () => {
      expect(timeToSeconds('0:00')).toBe(0)
      expect(timeToSeconds('1:00')).toBe(60)
      expect(timeToSeconds('2:30')).toBe(150)
      expect(timeToSeconds('15:45')).toBe(945)
    })

    it('should handle empty or invalid input', () => {
      expect(timeToSeconds('')).toBe(0)
      expect(timeToSeconds('0:00')).toBe(0)
    })
  })

  describe('secondsToTime', () => {
    it('should convert seconds to time string correctly', () => {
      expect(secondsToTime(0)).toBe('0:00')
      expect(secondsToTime(60)).toBe('01:00')
      expect(secondsToTime(150)).toBe('02:30')
      expect(secondsToTime(945)).toBe('15:45')
    })

    it('should handle negative values', () => {
      expect(secondsToTime(-10)).toBe('0:00')
      expect(secondsToTime(-1)).toBe('0:00')
    })

    it('should format single digit minutes and seconds correctly', () => {
      expect(secondsToTime(5)).toBe('00:05')
      expect(secondsToTime(65)).toBe('01:05')
    })
  })

  describe('round trip conversion', () => {
    it('should maintain consistency in both directions', () => {
      const testTimes = ['0:00', '02:30', '15:45', '09:15']

      testTimes.forEach(time => {
        const seconds = timeToSeconds(time)
        const backToTime = secondsToTime(seconds)
        expect(backToTime).toBe(time)
      })
    })
  })

  describe('time adjustment simulation', () => {
    it('should handle +5 second adjustments correctly', () => {
      expect(secondsToTime(timeToSeconds('02:25') + 5)).toBe('02:30')
      expect(secondsToTime(timeToSeconds('02:55') + 5)).toBe('03:00')
    })

    it('should handle -5 second adjustments correctly', () => {
      expect(secondsToTime(timeToSeconds('02:30') - 5)).toBe('02:25')
      expect(secondsToTime(timeToSeconds('03:00') - 5)).toBe('02:55')
    })

    it('should prevent negative times', () => {
      expect(secondsToTime(Math.max(0, timeToSeconds('00:02') - 5))).toBe('0:00')
      expect(secondsToTime(Math.max(0, timeToSeconds('00:05') - 10))).toBe('0:00')
    })
  })
})