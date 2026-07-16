import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../styles/pages.css', import.meta.url), 'utf8')

describe('records archive layout contract', () => {
  it('shares the exact field-column variables between headers and record values', () => {
    expect(css).toContain('--records-snapshot-columns:')
    expect(css).toContain('--records-order-columns:')
    expect(css).toMatch(
      /\.records-timeline-head-fields--snapshots,\s*\.records-timeline-card--snapshot \.records-timeline-fields\s*\{\s*grid-template-columns: var\(--records-snapshot-columns\);/,
    )
    expect(css).toMatch(
      /\.records-timeline-head-fields--orders,\s*\.records-timeline-card--order \.records-timeline-fields\s*\{\s*grid-template-columns: var\(--records-order-columns\);/,
    )
  })

  it('keeps desktop records in a right-side ledger with an internal scrolling body', () => {
    expect(css).toMatch(
      /\.records-archive-page \.records-archive\s*\{[\s\S]*width: 100%;[\s\S]*max-width: none;[\s\S]*grid-template-columns: minmax\(360px, 1fr\) minmax\(900px, 1120px\);/,
    )
    expect(css).toMatch(/\.records-archive \.my-page-console\s*\{[\s\S]*width: min\(100%, 1120px\);/)
    expect(css).toMatch(
      /\.records-timeline-scroll\s*\{[\s\S]*max-height: min\(calc\(100dvh - 255px\), 520px\);[\s\S]*overflow-y: auto;/,
    )
  })
})
