import { createContext, useContext } from 'react'

export type FirstVisitFlowContextValue = {
  skipActive: boolean
  showAgain: () => void
  firstVisitGateActive: boolean
  welcomePending: boolean
  showWelcome: () => void
}

export const FirstVisitFlowContext = createContext<FirstVisitFlowContextValue | null>(null)

export function useFirstVisitGateActive(): boolean {
  return useContext(FirstVisitFlowContext)?.firstVisitGateActive ?? false
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
