import { createContext, useContext } from 'react'

// Live calculator IDs stay stable; read-only copies get independent label IDs.
export const CalculatorFieldScope = createContext('')

export function useCalculatorFieldId(name: string) {
  const scope = useContext(CalculatorFieldScope)
  return scope ? `${scope}-${name}` : name
}
