import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('calculator modal overlays', () => {
  it('renders draft-save modals through the document body portal', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain("import { createPortal } from 'react-dom'")
    expect(text).toContain('document.body.style.overflow')
    expect(text).toContain('return createPortal(modal, document.body)')
  })

  it('renders clear-all confirmation through the document body portal', () => {
    const text = source('src/components/ClearAllInputsButton.tsx')

    expect(text).toContain("import { createPortal } from 'react-dom'")
    expect(text).toContain('document.body.style.overflow')
    expect(text).toContain('return createPortal(modal, document.body)')
  })
})
