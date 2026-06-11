import { createContext, useContext, type ReactNode } from 'react'

export type LayoutMode = 'auto' | 'manual'

export interface LayoutContextValue {
  layoutMode: LayoutMode
  fitScale: number
}

const LayoutContext = createContext<LayoutContextValue>({
  layoutMode: 'auto',
  fitScale: 1,
})

export function LayoutProvider({
  layoutMode,
  fitScale,
  children,
}: LayoutContextValue & { children: ReactNode }) {
  return (
    <LayoutContext.Provider value={{ layoutMode, fitScale }}>{children}</LayoutContext.Provider>
  )
}

export function useLayout(): LayoutContextValue {
  return useContext(LayoutContext)
}
