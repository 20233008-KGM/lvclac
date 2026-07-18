import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/TrustModalFrame.tsx'), 'utf8')

describe('TrustModalFrame accessibility contract', () => {
  it('renders body-level modal semantics with an accessible title', () => {
    expect(source).toContain('createPortal(modal, document.body)')
    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
    expect(source).toContain('aria-labelledby={titleId}')
  })

  it('focuses the heading, traps tab focus, and restores focus on close', () => {
    expect(source).toContain("titleRef.current?.focus({ preventScroll: true })")
    expect(source).toContain("event.key !== 'Tab'")
    expect(source).toContain('useModalFocusRestore()')
  })

  it('only closes on Escape or overlay click when a close handler exists', () => {
    expect(source).toContain("event.key === 'Escape' && closeHandlerRef.current")
    expect(source).toContain('event.target === event.currentTarget')
    expect(source).toContain('closeHandlerRef.current?.()')
  })

  it('renders the close mark as a stable two-path SVG icon', () => {
    expect(source).toContain('<svg viewBox="0 0 16 16"')
    expect(source).toContain('<path d="M3.5 3.5 12.5 12.5" />')
    expect(source).toContain('<path d="m12.5 3.5-9 9" />')
  })

  it('locks background scroll while the modal is mounted', () => {
    expect(source).toContain("document.body.style.overflow = 'hidden'")
    expect(source).toContain('document.body.style.overflow = previousOverflow')
  })
})
