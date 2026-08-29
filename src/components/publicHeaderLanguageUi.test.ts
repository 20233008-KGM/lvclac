import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const mainSource = readFileSync(resolve('src/main.tsx'), 'utf8')
const appSource = readFileSync(resolve('src/App.tsx'), 'utf8')
const appCss = readFileSync(resolve('src/App.css'), 'utf8')

describe('public header language and release-stage controls', () => {
  it('does not mount the internal fixed language and preset controls', () => {
    expect(mainSource).not.toContain('showFixedWidgets')
    expect(mainSource).not.toContain('<LanguageToggle variant="fixed" />')
    expect(mainSource).not.toContain('<PresetSelect variant="fixed" />')
  })

  it('shows a dedicated beta badge beside the calculator title', () => {
    expect(appSource).toContain('<span className="product-stage-badge">BETA</span>')
    expect(appCss).toContain('.product-stage-badge')
  })
})
