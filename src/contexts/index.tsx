import type { ReactNode } from 'react'
import { AppProvider } from './AppContext'
import { RaceProvider } from './RaceContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AppProvider>
      <RaceProvider>
        {children}
      </RaceProvider>
    </AppProvider>
  )
}

