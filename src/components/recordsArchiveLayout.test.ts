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

  it('uses the full desktop width for a divided memo-and-ledger workspace', () => {
    expect(css).toMatch(
      /\.records-archive-page \.records-archive\s*\{[\s\S]*width: 100%;[\s\S]*max-width: none;[\s\S]*grid-template-columns: minmax\(360px, 2fr\) minmax\(0, 3fr\);/,
    )
    expect(css).toMatch(
      /\.records-archive \.my-page-console\s*\{[\s\S]*width: 100%;[\s\S]*border-left: 1px solid var\(--color-border-subtle\);/,
    )
    expect(css).toContain('--records-timeline-height: clamp(480px, calc(100dvh - 230px), 680px);')
    expect(css).toMatch(
      /\.records-archive-panel\s*\{[\s\S]*border: 0;[\s\S]*background: transparent;/,
    )
    expect(css).toMatch(
      /\.records-timeline-scroll\s*\{[\s\S]*height: var\(--records-timeline-height\);[\s\S]*max-height: none;[\s\S]*overflow-y: auto;/,
    )
    expect(css).toContain('height: max(184px, calc(var(--records-timeline-height) / 2 - 26px));')
  })

  it('centers time and slot metadata on desktop and folds it into one mobile row', () => {
    expect(css).toMatch(/\.records-timeline-row\s*\{[\s\S]*align-items: center;/)
    expect(css).toMatch(/\.records-timeline-meta\s*\{[\s\S]*display: grid;[\s\S]*align-self: center;/)
    expect(css).toMatch(/\.records-timeline-slot\s*\{[\s\S]*text-overflow: ellipsis;/)
    expect(css).toMatch(
      /@media[\s\S]*\.records-timeline-meta\s*\{[\s\S]*grid-row: 1;[\s\S]*display: flex;/,
    )
  })
})
