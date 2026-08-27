import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const mainSource = readFileSync(resolve('src/main.tsx'), 'utf8')
const appSource = readFileSync(resolve('src/App.tsx'), 'utf8')
const appCss = readFileSync(resolve('src/App.css'), 'utf8')

describe('public header language and release-stage controls', () => {
  it('keeps language and preset controls available outside the internal kit route', () => {
    expect(mainSource).toContain('const showFixedWidgets = !isKitPath(window.location.pathname)')
    expect(mainSource).toContain('{showFixedWidgets && <LanguageToggle variant="fixed" />}')
  })

  it('shows a dedicated beta badge beside the calculator title', () => {
    expect(appSource).toContain('<span className="product-stage-badge">BETA</span>')
    expect(appCss).toContain('.product-stage-badge')
  })
})
