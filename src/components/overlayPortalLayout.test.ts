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

describe('number set detail modal', () => {
  it('renders the read-only detail view through the document body portal', () => {
    const text = source('src/components/NumberSetDetailModal.tsx')

    expect(text).toContain("import { createPortal } from 'react-dom'")
    expect(text).toContain("import { useModalFocusRestore } from '../hooks/useModalFocusRestore'")
    expect(text).toContain('document.body.style.overflow')
    expect(text).toContain('return createPortal(modal, document.body)')
    expect(text).toContain('role="dialog"')
    expect(text).toContain('aria-modal="true"')
    // Closes on Escape and shows both input and result sections.
    expect(text).toContain("e.key === 'Escape'")
    expect(text).toContain('numberSetDetailInputsHeading')
    expect(text).toContain('numberSetDetailResultsHeading')
    expect(text).toContain('calculateEvaluate')
  })

  it('wires the number-set row to open the detail modal from the expanded peek', () => {
    const text = source('src/components/MyPage.tsx')

    expect(text).toContain("import { NumberSetDetailModal } from './NumberSetDetailModal'")
    expect(text).toContain('setDetailModalOpen')
    expect(text).toContain('restoreFocusRef={detailModalTriggerRef}')
    expect(text).toContain('copy.numberSetDetailOpen')
  })
})

describe('records context menu', () => {
  it('renders the ledger right-click menu through the document body portal', () => {
    const text = source('src/components/RecordsContextMenu.tsx')

    expect(text).toContain("import { createPortal } from 'react-dom'")
    expect(text).toContain('return createPortal(menu, document.body)')
    expect(text).toContain('role="menu"')
    expect(text).toContain('role="menuitem"')
    // Closes on outside interaction, escape, scroll, and resize.
    expect(text).toContain("window.addEventListener('pointerdown'")
    expect(text).toContain("event.key === 'Escape'")
    expect(text).toContain("window.addEventListener('scroll'")
  })

  it('wires right-click on ledger cards to open the context menu', () => {
    const text = source('src/components/RecordsArchivePage.tsx')

    expect(text).toContain('onContextMenu={onContextMenu}')
    expect(text).toContain('const openContextMenu =')
    expect(text).toContain('event.preventDefault()')
    expect(text).toContain('buildMenuItems')
  })
})
