import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const inputPanel = readFileSync(resolve('src/components/InputPanel.tsx'), 'utf8')
const css = readFileSync(resolve('src/App.css'), 'utf8')

describe('input panel margin layout', () => {
  it('keeps long localized margin labels and inputs inside equal-width columns', () => {
    expect(inputPanel).toContain(
      'className={`field-section field-section--margin field-section--margin-${mode}`}',
    )
    expect(css).toMatch(
      /\.input-panel \.field-section \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    )
    expect(css).toMatch(
      /\.input-panel \.field-section--margin > \.field \.field-label-row,[\s\S]*?white-space: normal;/,
    )
    expect(css).toMatch(
      /:root\[lang='en'\] \.input-panel \.field-section--margin-perContract > \.field \.field-label-row \{[\s\S]*?min-height: 2\.7em;/,
    )
  })
})
