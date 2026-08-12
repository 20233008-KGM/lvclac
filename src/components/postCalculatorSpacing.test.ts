import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve('src/App.css'), 'utf8')

describe('post-calculator vertical rhythm', () => {
  it('uses explicit desktop spacing without stacked component margins', () => {
    expect(css).toMatch(
      /\.calc-viewport \+ \.public-seo-summary \{[\s\S]*?margin-top: calc\(var\(--space-md\) \* 5\);[\s\S]*?margin-bottom: 0;/,
    )
    expect(css).toMatch(
      /\.public-seo-summary \+ \.content-risk-notice \{[\s\S]*?margin-top: calc\(var\(--space-xl\) \+ var\(--space-md\)\);/,
    )
    expect(css).toMatch(
      /\.content-risk-notice \+ \.site-footer \{[\s\S]*?margin-top: calc\(var\(--space-xl\) \+ var\(--space-md\)\);/,
    )
  })

  it('uses the compact mobile spacing contract', () => {
    expect(css).toMatch(
      /@media \(max-width: 640px\) \{[\s\S]*?\.calc-viewport \+ \.public-seo-summary \{[\s\S]*?margin-top: calc\(var\(--space-xl\) \+ var\(--space-sm\)\);/,
    )
    expect(css).toMatch(
      /\.public-seo-summary \+ \.content-risk-notice,[\s\S]*?\.content-risk-notice \+ \.site-footer \{[\s\S]*?margin-top: calc\(var\(--space-md\) \+ var\(--space-sm\)\);/,
    )
  })
})
