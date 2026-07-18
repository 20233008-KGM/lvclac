import { createContext, useContext } from 'react'

export type FirstVisitFlowContextValue = {
  skipActive: boolean
  showAgain: () => void
  firstVisitGateActive: boolean
}

export const FirstVisitFlowContext = createContext<FirstVisitFlowContextValue | null>(null)

export function useFirstVisitGateActive(): boolean {
  return useContext(FirstVisitFlowContext)?.firstVisitGateActive ?? false
}
