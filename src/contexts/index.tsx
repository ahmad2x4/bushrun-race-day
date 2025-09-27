import type { ReactNode } from 'react'
import { AppProvider } from './AppContext'
import { RaceProvider } from './RaceContext'
import { WakeLockProvider } from './WakeLockContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AppProvider>
      <RaceProvider>
        <WakeLockProvider>
          {children}
        </WakeLockProvider>
      </RaceProvider>
    </AppProvider>
  )
}

