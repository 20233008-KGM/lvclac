import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appSource = readFileSync(resolve('src/App.tsx'), 'utf8')
const appCss = readFileSync(resolve('src/App.css'), 'utf8')
const responsiveCss = readFileSync(resolve('src/styles/responsive.css'), 'utf8')
const localeSources = [
  readFileSync(resolve('src/i18n/locales/ko.ts'), 'utf8'),
  readFileSync(resolve('src/i18n/locales/en.ts'), 'utf8'),
  readFileSync(resolve('src/i18n/types.ts'), 'utf8'),
]

describe('calculator header intro removal', () => {
  it('does not render or style the legacy intro on any viewport', () => {
    expect(appSource).not.toContain('app-intro')
    expect(appSource).not.toContain('t.appIntro')
    expect(appCss).not.toContain('.app-intro')
    expect(responsiveCss).not.toContain('.app-intro')
  })

  it('removes the unused localized copy contract', () => {
    for (const source of localeSources) {
      expect(source).not.toContain('appIntro')
    }
  })
})
