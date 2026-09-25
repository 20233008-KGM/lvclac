import { useId } from 'react'
import type { CalculatorInputs } from '../types'
import { CalculatorFieldScope } from '../context/CalculatorFieldScope'
import { LayoutProvider } from '../context/LayoutContext'
import { InputPanel } from './InputPanel'
import { ResultPanel } from './ResultPanel'
import '../styles/readOnlyCalculator.css'

const noopChange = () => undefined

/** Teaching panel using the saved-record presentation. No calculator state is owned here. */
export function ReadOnlyCalculator({ inputs, label, showOrderInputs = false }: {
  inputs: CalculatorInputs
  label: string
  showOrderInputs?: boolean
}) {
  const scope = useId()
  return <div className="read-only-calculator" role="group" aria-label={label} aria-disabled="true">
    <CalculatorFieldScope.Provider value={scope}>
      <LayoutProvider layoutMode="auto" fitScale={1}>
        {/* disabled covers native controls; inert also blocks scrubbing, links and focusable help. */}
        <fieldset disabled inert className={`read-only-calculator__panels${showOrderInputs ? ' read-only-calculator__panels--order-entry' : ''}`}>
          <InputPanel inputs={inputs} onChange={noopChange} />
          <ResultPanel inputs={inputs} onChange={noopChange} />
        </fieldset>
      </LayoutProvider>
    </CalculatorFieldScope.Provider>
  </div>
}
