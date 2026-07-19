import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/ResultPanel.tsx'), 'utf8')

describe('result risk highlight UI', () => {
  it('uses the red highlight without repeating liquidation-risk text', () => {
    expect(source).toContain("result.liquidationMessage === 'maintenance_exceeds_equity'")
    expect(source).toContain('sub={liquidationSub}')
    expect(source).not.toContain("translateCalcMessage('at_risk')")

    expect(source.match(/danger=\{result\.isAtRisk\}/g)).toHaveLength(2)
  })

  it('keeps non-risk calculation guidance in the liquidation-price card', () => {
    expect(source).toContain(': translateCalcMessage(result.liquidationMessage)')
  })
})
