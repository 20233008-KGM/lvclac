import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// BulkDeleteConfirmModal renders through createPortal(modal, document.body), and this
// project's Vitest environment has no DOM (no jsdom/@testing-library/react installed).
// react-dom's server renderer has no `document` global to portal into, so
// renderToStaticMarkup throws "document is not defined" for this component — the same
// constraint documented for the other document.body-portal modals (AuthModal,
// SnapshotSavedModal; see overlayPortalLayout.test.ts / authDialogLayout.test.ts /
// SnapshotSavedModal.test.ts). Structural/behavioral guarantees are verified via source
// inspection instead, matching that existing convention.
const source = readFileSync(resolve('src/components/BulkDeleteConfirmModal.tsx'), 'utf8')

describe('BulkDeleteConfirmModal', () => {
  it('imports the close-button stylesheet shared with AuthModal', () => {
    expect(source).toContain("import '../styles/auth-dialog.css'")
  })

  it('exposes an accessible dialog labelled by its own title', () => {
    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
    expect(source).toContain('aria-labelledby="bulk-delete-confirm-title"')
    expect(source).toContain('id="bulk-delete-confirm-title"')
  })

  it('closes on Escape and on overlay click', () => {
    expect(source).toMatch(/if \(e\.key === 'Escape'\) onClose\(\)/)
    expect(source).toMatch(/if \(e\.target === e\.currentTarget\) onClose\(\)/)
  })

  it('wires the close (X) button and Cancel button to onClose', () => {
    expect(source).toMatch(/className="auth-modal-close"\s*\n\s*onClick={onClose}/)
    expect(source).toMatch(/className="btn btn-ghost" disabled={busy} onClick={onClose}/)
  })

  it('wires the danger confirm button to onConfirm, swapping its label while busy', () => {
    expect(source).toMatch(/className="btn btn-danger" disabled={busy} onClick={onConfirm}/)
    expect(source).toContain('{busy ? copy.confirmBusy : copy.confirm}')
  })

  it('locks body scroll while open, same as AuthModal', () => {
    expect(source).toContain('document.body.style.overflow')
  })

  it('uses the shared useModalFocusRestore hook to restore focus to the trigger', () => {
    expect(source).toContain("import { useModalFocusRestore } from '../hooks/useModalFocusRestore'")
    expect(source).toContain('useModalFocusRestore()')
  })
})
