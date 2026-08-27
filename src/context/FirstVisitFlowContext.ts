import { createContext, useContext } from 'react'

export type FirstVisitFlowContextValue = {
  skipActive: boolean
  showAgain: () => void
  welcomePending: boolean
  showWelcome: () => void
}

export const FirstVisitFlowContext = createContext<FirstVisitFlowContextValue | null>(null)

export function useFirstVisitDisclaimer(): Pick<
  FirstVisitFlowContextValue,
  'skipActive' | 'showAgain'
> | null {
  const context = useContext(FirstVisitFlowContext)
  if (!context) return null
  return {
    skipActive: context.skipActive,
    showAgain: context.showAgain,
  }
}

export function useFirstVisitWelcome(): Pick<
  FirstVisitFlowContextValue,
  'welcomePending' | 'showWelcome'
> | null {
  const context = useContext(FirstVisitFlowContext)
  if (!context) return null
  return {
    welcomePending: context.welcomePending,
    showWelcome: context.showWelcome,
  }
}

export function useFirstVisitGateActive(): boolean {
  const context = useContext(FirstVisitFlowContext)
  return Boolean(context?.welcomePending)
}
