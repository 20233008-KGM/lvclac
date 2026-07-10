import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// SnapshotSavedModal renders through createPortal(modal, document.body), and this
// project's Vitest environment has no DOM (no jsdom/@testing-library/react installed).
// react-dom's server renderer has no `document` global to portal into, so
// renderToStaticMarkup throws "document is not defined" for this component — the same
// constraint documented for the other document.body-portal modals (AuthModal,
// SaveDraftToggle, ClearAllInputsButton; see overlayPortalLayout.test.ts /
// authDialogLayout.test.ts). Structural/behavioral guarantees are verified via source
// inspection instead, matching that existing convention.
const source = readFileSync(resolve('src/components/SnapshotSavedModal.tsx'), 'utf8')

describe('SnapshotSavedModal', () => {
  it('imports the close-button stylesheet shared with AuthModal', () => {
    expect(source).toContain("import '../styles/auth-dialog.css'")
  })

  it('exposes an accessible dialog labelled by its own title', () => {
    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
    expect(source).toContain('aria-labelledby="snapshot-saved-modal-title"')
    expect(source).toContain('id="snapshot-saved-modal-title"')
  })

  it('closes on close-button click, overlay click, and Escape — matching the AuthModal shell', () => {
    expect(source).toContain('onClick={onClose}')
    expect(source).toMatch(/if \(e\.target === e\.currentTarget\) onClose\(\)/)
    expect(source).toMatch(/if \(e\.key === 'Escape'\) onClose\(\)/)
  })

  it('locks body scroll while open, same as AuthModal', () => {
    expect(source).toContain('document.body.style.overflow')
  })

  it('has no Tab-focus trap — a deliberate downgrade from the deleted AccountRecordsModal, matching AuthModal', () => {
    expect(source).not.toContain('FOCUSABLE_SELECTOR')
    expect(source).not.toContain("e.key !== 'Tab'")
    expect(source).not.toContain('querySelectorAll')
  })

  it('renders exactly one primary action that navigates to the saved records', () => {
    expect(source).toContain('onClick={onGoToRecords}')
    expect(source).toContain('btn btn-primary')
  })
})
