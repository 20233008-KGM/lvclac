import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/TrustModalFrame.tsx'), 'utf8')
const css = readFileSync(resolve('src/App.css'), 'utf8')

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

  it('uses a neutral transparent warning box with bold underlined copy in the service notice', () => {
    expect(css).toMatch(
      /\.trust-modal--service \.trust-modal__body \{[\s\S]*?padding-bottom: var\(--space-sm\);/,
    )
    expect(css).toMatch(
      /\.trust-modal--service \.disclaimer-modal-warning \{[\s\S]*?grid-template-columns: 12px minmax\(0, 1fr\);[\s\S]*?gap: var\(--space-sm\);[\s\S]*?margin: var\(--space-sm\) 0 0;[\s\S]*?padding: var\(--space-xs\) 12px;[\s\S]*?border: 0;[\s\S]*?background: transparent;/,
    )
    expect(css).toMatch(
      /\.trust-modal--service \.disclaimer-warning-icon \{[\s\S]*?width: 12px;[\s\S]*?height: 12px;[\s\S]*?border: 1px solid var\(--color-text-muted\);[\s\S]*?color: var\(--color-text-muted\);[\s\S]*?font-size: 8px;[\s\S]*?line-height: 1;[\s\S]*?margin-top: 3px;/,
    )
    expect(css).toMatch(
      /\.trust-modal--service \.legal-emphasis \{[\s\S]*?font-weight: 600;[\s\S]*?text-decoration: underline;[\s\S]*?text-underline-offset: 2px;/,
    )
  })
})
