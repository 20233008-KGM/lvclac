import { useRef, useState, type KeyboardEvent } from 'react'
import { useLanguage } from '../i18n'
import { formatNumber } from '../utils/format'
import { buildExampleStages, calculatorExamples } from './calculatorExampleScenarios'
import { ReadOnlyCalculator } from './ReadOnlyCalculator'
import type { CalculatorInputs } from '../types'
import { calculatorExamplesCopy } from './calculatorExamplesCopy'
import '../styles/calculatorExamples.css'

export function CalculatorExamples() {
  const { locale } = useLanguage()
  const copy = calculatorExamplesCopy[locale]
  const [selected, setSelected] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const example = calculatorExamples[selected]
  const stages = buildExampleStages(example)
  const spec = copy.specs
  const inputs = example.inputs
  const marginFields = copy.marginFields[inputs.marginInputMode === 'perContract' ? 'perContract' : 'rate']
  const unit = example.id === 'index' ? spec.point : example.id === 'stock' ? spec.perShare : spec.perBarrel
  const multiplierUnit = example.id === 'index' ? spec.perPoint : example.id === 'stock' ? spec.shares : spec.barrels
  const margin = (rate: number | undefined, amount: number | undefined) => inputs.marginInputMode === 'rate'
    ? `${formatNumber((rate ?? 0) * 100)}% (${rate})`
    : `${formatNumber(amount ?? null)} ${spec.perContract}`
  const specifications = [
    [spec.currency, example.currency],
    [spec.price, `${formatNumber(inputs.currentPrice ?? null)} ${unit}`],
    [spec.multiplier, `${formatNumber(inputs.contractMultiplier ?? null)} ${multiplierUnit}`],
    [spec.notional, `${formatNumber((inputs.currentPrice ?? 0) * (inputs.contractMultiplier ?? 0))} ${example.currency}`],
    [spec.maintenance, margin(inputs.maintenanceMarginRate, inputs.maintenanceMarginPerContract)],
    [spec.initial, margin(inputs.entrustedMarginRate, inputs.entrustedMarginPerContract)],
    [spec.equity, `${formatNumber(inputs.accountEval ?? null)} ${example.currency}`],
    [spec.tickSize, `${formatNumber(inputs.tickSize ?? null, 2)} ${unit}`],
    [spec.position, `${spec.long} · ${inputs.contracts} ${spec.contracts}`],
  ]
  const summaries = [
    copy.emptyScreen,
    `${copy.contracts} ${stages.initial.contracts} · ${copy.liquidation} ${formatNumber(stages.evaluation.liquidationPrice)}`,
    `${copy.contracts} ${stages.initial.contracts} → ${stages.added.contracts} · ${copy.liquidation} ${formatNumber(stages.addition.beforeLiquidation)} → ${formatNumber(stages.addition.afterLiquidation)}`,
    `${copy.contracts} ${stages.added.contracts} → ${stages.reduced.contracts} · ${copy.liquidation} ${formatNumber(stages.reduction.beforeLiquidation)} → ${formatNumber(stages.reduction.afterLiquidation)}`,
  ]
  const screens: CalculatorInputs[] = [
    { mode: 'evaluate', positionSide: 'long', marginInputMode: example.inputs.marginInputMode },
    stages.initial,
    { ...stages.initial, mode: 'order', orderContracts: example.add, orderPrice: stages.initial.currentPrice },
    { ...stages.added, mode: 'order', orderContracts: -example.reduce, orderPrice: stages.added.currentPrice },
  ]

  function selectWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % calculatorExamples.length
      : event.key === 'ArrowLeft' ? (index + calculatorExamples.length - 1) % calculatorExamples.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? calculatorExamples.length - 1 : null
    if (next == null) return
    event.preventDefault()
    setSelected(next)
    tabs.current[next]?.focus()
  }

  return <section className="calculator-examples" aria-labelledby="calculator-examples-title">
    <header className="calculator-examples__header">
      <span className="calculator-examples__eyebrow">LiqGuard · EXAMPLES</span>
      <h2 id="calculator-examples-title" tabIndex={-1}>{copy.title}</h2><p>{copy.lead}</p>
    </header>
    <div className="calculator-examples__tabs" role="tablist" aria-label={copy.title}>
      {calculatorExamples.map((item, index) => <button key={item.id} type="button" role="tab"
        id={`example-tab-${item.id}`} aria-selected={selected === index} aria-controls="calculator-example-panel"
        tabIndex={selected === index ? 0 : -1} ref={(node) => { tabs.current[index] = node }}
        onClick={() => setSelected(index)} onKeyDown={(event) => selectWithKeyboard(event, index)}>
        {copy.products[item.id]}
      </button>)}
    </div>
    <div id="calculator-example-panel" role="tabpanel" aria-labelledby={`example-tab-${example.id}`} tabIndex={0}>
      <div className="calculator-examples__context"><h3>{copy.names[example.id]}</h3><span>{copy.readOnly}</span></div>
      <p className="calculator-examples__profile">{copy.profiles[example.id]}</p>
      <p className="calculator-examples__assumptions">{copy.assumptions}</p>
      <table className="calculator-examples__specs" role="table">
        <caption>{spec.title}</caption>
        <tbody role="rowgroup">{specifications.map(([label, value]) => <tr key={label} role="row">
          <th scope="row" role="rowheader">{label}</th><td role="cell">{value}</td>
        </tr>)}</tbody>
      </table>
      <ol className="calculator-examples__steps">
        {screens.map((screen, index) => <li className="calc-example" data-example-step={index + 1} key={index}>
          <div className="calc-example__copy">
            <span className="calc-example__step" aria-hidden="true">0{index + 1}</span>
            <h3>{copy.steps[index]}</h3><p>{copy.descriptions[index].replace('{margins}', marginFields)}</p>
            {index !== 1 && <p className="calc-example__focus-note"><span aria-hidden="true">◆</span> {copy.focusNotes[index].replaceAll('{count}', String(example.reduce)).replace('{margins}', marginFields)}</p>}
          </div>
          <figure className="calc-example__preview">
            <ReadOnlyCalculator key={`${locale}-${example.id}-${index}`} inputs={screen}
              label={`${copy.products[example.id]} · ${copy.steps[index]}. ${summaries[index]}`}
              showOrderInputs={index >= 2} />
            <figcaption>{summaries[index]}</figcaption>
          </figure>
        </li>)}
      </ol>
      <p className="calculator-examples__assumptions">{copy.rounding}</p>
    </div>
  </section>
}
