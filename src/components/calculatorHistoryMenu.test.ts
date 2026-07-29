import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { calculateOrder, captureOrderScenarioBaseline } from '../calc/leverage'
import { applyInputPatch } from '../calc/mtmLink'
import type { CalculatorHistoryMove } from '../context/calculatorHistory'
import { en } from '../i18n/locales/en'
import { ko } from '../i18n/locales/ko'
import type { CalculatorInputs } from '../types'
import { describeCalculatorHistoryMove } from './calculatorHistoryDescription'

const source = readFileSync(resolve('src/components/CalculatorHistoryMenu.tsx'), 'utf8')
const css = readFileSync(resolve('src/App.css'), 'utf8')

function move(before: CalculatorInputs, after: CalculatorInputs): CalculatorHistoryMove {
  return {
    direction: 'undo',
    steps: 1,
    target: before,
    before,
    after,
  }
}

const base: CalculatorInputs = {
  mode: 'evaluate',
  positionSide: 'long',
  accountEval: 1_000,
  contracts: 15,
  contractAmount: 25_000,
  currentPrice: 350,
  contractMultiplier: 1,
}

describe('calculator history menu descriptions', () => {
  it('shows a direct field edit as label plus adjacent before and after values', () => {
    const description = describeCalculatorHistoryMove(
      move(base, { ...base, accountEval: 2_000 }),
      ko,
    )

    expect(description).toEqual({
      kind: 'fields',
      diffs: [
        {
          key: 'accountEval',
          label: '계좌 평가금액',
          before: '1,000',
          after: '2,000',
        },
      ],
      fullDescription: '계좌 평가금액 1,000 → 2,000',
    })
  })

  it('uses the active field label for held contracts', () => {
    const description = describeCalculatorHistoryMove(
      move(base, { ...base, contracts: 20 }),
      ko,
    )

    expect(description.kind).toBe('fields')
    if (description.kind !== 'fields') return
    expect(description.diffs).toEqual([
      {
        key: 'contracts',
        label: '보유 계약수',
        before: '15',
        after: '20',
      },
    ])
  })

  it('shows only current price when mark update also changes account equity', () => {
    const after = applyInputPatch(base, { applyMarkPrice: 355 })
    const description = describeCalculatorHistoryMove(move(base, after), ko)

    expect(description.kind).toBe('fields')
    if (description.kind !== 'fields') return
    expect(description.diffs).toEqual([
      {
        key: 'currentPrice',
        label: '현재가',
        before: '350',
        after: '355',
      },
    ])
  })

  it('shows the order-price link state as a localized field change', () => {
    const description = describeCalculatorHistoryMove(
      move(
        { ...base, orderPrice: 340, orderPriceLinked: false },
        { ...base, orderPrice: 350, orderPriceLinked: true },
      ),
      ko,
    )

    expect(description.kind).toBe('fields')
    if (description.kind !== 'fields') return
    expect(description.diffs).toContainEqual({
      key: 'orderPriceLinked',
      label: '주문가격 현재가 연동',
      before: '해제',
      after: '연동',
    })
  })

  it('summarizes a final order once and preserves a negative contract sign', () => {
    const orderInputs: CalculatorInputs = {
      ...base,
      mode: 'order',
      maintenanceMarginRate: 0.1,
      entrustedMarginRate: 0.2,
      contracts: 20,
      orderContracts: -14,
      orderPrice: 25_000,
    }
    const baseline = captureOrderScenarioBaseline(calculateOrder(orderInputs))
    const preview = applyInputPatch(orderInputs, { commitOrderScenario: baseline })
    const before = applyInputPatch(preview, { clearOrderScenario: true })
    const after = applyInputPatch(preview, { applyOrderScenario: true })

    expect(describeCalculatorHistoryMove(move(before, after), ko)).toEqual({
      kind: 'order',
      summary: '주문 25,000, -14계약',
      fullDescription: '주문 25,000, -14계약',
    })
    expect(describeCalculatorHistoryMove(move(before, after), en)).toEqual({
      kind: 'order',
      summary: 'Order 25,000, -14 contracts',
      fullDescription: 'Order 25,000, -14 contracts',
    })
  })

  it('does not emit legacy scenario-price labels for internal-only changes', () => {
    const after = { ...base, scenarioPrice: 360 }
    const description = describeCalculatorHistoryMove(move(base, after), ko)

    expect(description).toBeNull()
  })
})

describe('calculator history menu structure', () => {
  it('renders two-line field rows and full accessible descriptions', () => {
    expect(source).toContain('calculator-history-menu__item-label')
    expect(source).toContain('calculator-history-menu__item-detail')
    expect(source).toContain('title={description.fullDescription}')
    expect(source).toContain('aria-label={description.fullDescription}')
    expect(css).toContain('font-variant-numeric: tabular-nums')
    expect(css).toContain('width: min(22rem, calc(100vw - 16px))')
  })

  it('keeps desktop hover and focus plus touch-friendly button access', () => {
    expect(source).toContain('onMouseEnter')
    expect(source).toContain('onMouseLeave')
    expect(source).toContain('onFocus')
    expect(source).toContain('onBlur')
    expect(source).toContain('onClick={handleButtonClick}')
    expect(source).toContain("window.matchMedia?.('(hover: hover)').matches")
    expect(css).toMatch(
      /\.calculator-history-menu::before\s*\{[^}]*bottom:\s*100%;[^}]*height:\s*var\(--space-xs\);/s,
    )
  })
})
