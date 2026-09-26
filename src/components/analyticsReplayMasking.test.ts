import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('analytics replay masking', () => {
  it('marks calculator numeric outputs for Clarity masking', () => {
    const result = source('src/components/ResultPanel.tsx')
    const input = source('src/components/InputPanel.tsx')

    expect(result).toContain('className="result-hero-value" data-clarity-mask="True"')
    expect(result).toContain('className="result-row-value" data-clarity-mask="True"')
    expect(result).toMatch(/data-clarity-mask="True">\s*<FitText>\{row\.before\}<\/FitText>/)
    expect(result).toMatch(/data-clarity-mask="True">\s*<FitText>\{row\.after\}<\/FitText>/)
    expect(result).toContain('className="order-scenario-chip" role="status" data-clarity-mask="True"')
    expect(input).toContain('className="derived-metric-value" data-clarity-mask="True"')
    expect(input).toContain('<strong data-clarity-mask="True">{value}</strong>')
  })
})
