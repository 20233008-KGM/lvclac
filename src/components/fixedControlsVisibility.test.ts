import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const mainSource = readFileSync(resolve('src/main.tsx'), 'utf8')

describe('fixed development controls', () => {
  it('does not mount the fixed language and preset controls', () => {
    expect(mainSource).not.toContain('showFixedWidgets')
    expect(mainSource).not.toContain('<LanguageToggle variant="fixed" />')
    expect(mainSource).not.toContain('<PresetSelect variant="fixed" />')
  })
})
