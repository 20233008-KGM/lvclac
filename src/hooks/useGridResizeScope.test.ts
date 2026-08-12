import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const hook = readFileSync(resolve('src/hooks/useGridResize.ts'), 'utf8')
const css = readFileSync(resolve('src/App.css'), 'utf8')
const app = readFileSync(resolve('src/App.tsx'), 'utf8')
const footer = readFileSync(resolve('src/components/SiteFooter.tsx'), 'utf8')

describe('calculator resize scope', () => {
  it('keeps the home explanation and footer centered at their default widths', () => {
    expect(hook).toContain("'--calc-static-content-offset'")
    expect(hook).toContain("'--calc-static-content-width'")
    expect(hook).toContain("`${(rightX - leftX) / 2}px`")
    expect(hook).toContain('`${Math.max(0, W - geo.leftX0 - geo.rightX0)}px`')
    expect(css).toContain(":root[data-calc-resize='custom'] .content-risk-notice")
    expect(css).toContain(":root[data-calc-resize='custom'] .content-risk-notice__text")
    expect(css).toContain(":root[data-calc-resize='custom'] .public-seo-summary")
    expect(css).toContain(":root[data-calc-resize='custom'] .site-footer")
    expect(app.indexOf('<PublicHomeSeoSummary />')).toBeLessThan(
      app.indexOf('<ContentRiskNotice />'),
    )
    expect(app.indexOf('<ContentRiskNotice />')).toBeLessThan(app.indexOf('<SiteFooter />'))
    expect(footer).not.toContain('<ContentRiskNotice />')
    expect(css).toContain('var(--calc-static-content-offset, 0px)')
    expect(css).toContain('var(--calc-static-content-width, var(--layout-max-width))')
  })
})
