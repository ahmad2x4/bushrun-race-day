import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock HTMLAudioElement for jsdom
// jsdom has limited HTMLMediaElement support and throws errors when code tries
// to use unimplemented features like load(), play(), pause(). Since audio is
// non-critical in this app (visual alerts are fallback), we mock it globally.
global.Audio = vi.fn(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  volume: 0.5,
  src: '',
})) as any