import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// SnapshotProGateModal renders through createPortal(modal, document.body), and this
// project's Vitest environment has no DOM. Structural/behavioral guarantees are verified
// via source inspection, matching SnapshotSavedModal.test.ts / overlayPortalLayout.test.ts.
const source = readFileSync(resolve('src/components/SnapshotProGateModal.tsx'), 'utf8')

describe('SnapshotProGateModal', () => {
  it('imports the close-button stylesheet shared with AuthModal', () => {
    expect(source).toContain("import '../styles/auth-dialog.css'")
  })

  it('exposes an accessible dialog labelled by its own title', () => {
    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
    expect(source).toContain('aria-labelledby="snapshot-pro-gate-title"')
    expect(source).toContain('id="snapshot-pro-gate-title"')
  })

  it('closes on close-button click, overlay click, and Escape — matching the AuthModal shell', () => {
    expect(source).toContain('onClick={onClose}')
    expect(source).toMatch(/if \(e\.target === e\.currentTarget\) onClose\(\)/)
    expect(source).toMatch(/if \(e\.key === 'Escape'\) onClose\(\)/)
  })

  it('locks body scroll while open, same as AuthModal', () => {
    expect(source).toContain('document.body.style.overflow')
  })

  it('shows login + view-plans for guests, upgrade-only for free users', () => {
    // guest: 로그인 유도 + 요금제 보기 두 버튼
    expect(source).toContain('onClick={onLogin}')
    expect(source).toContain('{copy.loginCta}')
    expect(source).toContain('{copy.viewPlansCta}')
    // free/guest 공통: 결제 페이지 이동
    expect(source).toContain('onClick={onUpgrade}')
    expect(source).toContain('{copy.upgradeCta}')
    // 모드 분기
    expect(source).toContain("const isGuest = mode === 'guest'")
  })
})
