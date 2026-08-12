import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const hook = readFileSync(resolve('src/hooks/useGridResize.ts'), 'utf8')
const css = readFileSync(resolve('src/App.css'), 'utf8')

describe('calculator resize scope', () => {
  it('keeps the home explanation and footer centered at their default widths', () => {
    expect(hook).toContain("'--calc-static-content-offset'")
    expect(hook).toContain("`${(rightX - leftX) / 2}px`")
    expect(css).toContain(":root[data-calc-resize='custom'] .content-risk-notice")
    expect(css).toContain(":root[data-calc-resize='custom'] .public-seo-summary")
    expect(css).toContain(":root[data-calc-resize='custom'] .site-footer")
    expect(css).toContain('var(--calc-static-content-offset, 0px)')
  })
})
