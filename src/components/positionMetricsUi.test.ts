import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string): string {
  return readFileSync(resolve(path), 'utf8')
}

describe('position metrics UI placement', () => {
  it('places tick P&L in the instrument grid immediately after tick size', () => {
    const text = source('src/components/InputPanel.tsx')
    const tickSizeIndex = text.indexOf('f.tickSize')
    const tickPnlIndex = text.indexOf('t.results.tickPnl')

    expect(tickSizeIndex).toBeGreaterThan(-1)
    expect(tickPnlIndex).toBeGreaterThan(-1)
    expect(tickSizeIndex).toBeLessThan(tickPnlIndex)
    expect(text).toContain('calcPositionTickPnl(displayInputs)')
  })

  it('renders tick P&L as a bare number without a per-tick suffix', () => {
    const text = source('src/components/InputPanel.tsx')

    expect(text).toContain('formatTickPnl(tickPnl)')
    expect(text).not.toContain('perTickUnit')
  })

  it('keeps tick P&L number weight aligned with neighboring numeric inputs', () => {
    const css = source('src/App.css')
    const match = css.match(/\.derived-metric-value\s*\{(?<body>[^}]*)\}/)

    expect(match?.groups?.body).toBeDefined()
    expect(match?.groups?.body).not.toContain('font-weight: 600')
  })

  it('left-aligns tick P&L values like neighboring instrument fields', () => {
    const css = source('src/App.css')
    const match = css.match(/\.derived-metric-box\s*\{(?<body>[^}]*)\}/)

    expect(match?.groups?.body).toBeDefined()
    expect(match?.groups?.body).toContain('justify-content: flex-start')
    expect(match?.groups?.body).not.toContain('justify-content: flex-end')
  })

  it('shows entry-price return at the right edge of the current-price header', () => {
    const text = source('src/components/ResultPanel.tsx')

    expect(text).toContain('calcEntryPriceReturnRate')
    expect(text).toContain('calcPositionUnrealizedPnl')
    expect(text).toContain('useFloatingTooltip')
    expect(text).toContain('labelMeta={formatEntryReturnMeta(entryReturnRate)}')
    expect(text).toContain('labelMetaTooltip={formatEntryPnlTooltip(entryPnl)}')
    expect(text).toContain('result-hero-pnl-tooltip')
    expect(text).not.toContain('positionRef={cardRef}')
    expect(text).not.toContain("horizontalAlign: 'right'")
    expect(text).not.toContain('entryReturnLabel')
    expect(text).not.toContain('entryPnlLabel')
    expect(text).not.toContain('labelMetaTitle')
    expect(text).not.toContain('formatEntryReturnSub')
    expect(text).toContain('result-hero-card--mark')
  })

  it('lays out hero label metadata without adding a value subline', () => {
    const css = source('src/App.css')

    expect(css).toContain('.result-hero-label-row')
    expect(css).toContain('.result-hero-label-meta')
    expect(css).toContain('.result-hero-pnl-tooltip')
  })

  it('keeps the P&L tooltip centered on the percent field anchor', () => {
    const hook = source('src/hooks/useFloatingTooltip.tsx')
    const text = source('src/components/ResultPanel.tsx')

    expect(text).toContain("placement: 'top'")
    expect(text).not.toContain('positionRef')
    expect(text).not.toContain("horizontalAlign: 'right'")
    expect(hook).not.toContain('positionRef?: RefObject<HTMLElement | null>')
  })
})
