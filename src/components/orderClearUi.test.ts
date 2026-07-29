import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('order input clear button', () => {
  it('renders the clear action in the order header and routes it through the input patch', () => {
    const panel = source('src/components/ResultPanel.tsx')
    const types = source('src/i18n/types.ts')
    const ko = source('src/i18n/locales/ko.ts')
    const en = source('src/i18n/locales/en.ts')

    expect(panel).toContain('result-panel--order__clear-btn')
    expect(panel).toContain('handleOrderChange({ clearOrderInputs: true })')
    expect(panel).toContain('inputs.orderContracts == null')
    expect(panel).toContain('inputs.orderPrice == null')
    expect(types).toContain('clearOrderInputs: string')
    expect(ko).toContain("clearOrderInputs: '비우기'")
    expect(en).toContain("clearOrderInputs: 'Clear'")
  })
})
