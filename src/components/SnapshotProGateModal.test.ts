import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// SnapshotProGateModal renders through createPortal(modal, document.body), and this
// project's Vitest environment has no DOM. Structural/behavioral guarantees are verified
// via source inspection, matching SnapshotSavedModal.test.ts / overlayPortalLayout.test.ts.
const source = readFileSync(resolve('src/components/SnapshotProGateModal.tsx'), 'utf8')
const resultPanelSource = readFileSync(resolve('src/components/ResultPanel.tsx'), 'utf8')

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

describe('ResultPanel snapshot Pro gating', () => {
  it('routes snapshot clicks by auth/pro state instead of saving unconditionally', () => {
    // 비로그인 → guest 게이트
    expect(resultPanelSource).toMatch(/if \(!userId\) \{\s*setSnapshotGateMode\('guest'\)/)
    // 로그인·무료 → free 게이트
    expect(resultPanelSource).toMatch(/if \(!isPro\) \{\s*setSnapshotGateMode\('free'\)/)
    // Pro만 실제 저장
    expect(resultPanelSource).toContain('void saveSnapshot()')
  })

  it('binds the snapshot button to the gating handler and no longer hides it behind login', () => {
    expect(resultPanelSource).toContain('onClick={handleSnapshotClick}')
    expect(resultPanelSource).not.toContain('{userId && (\n              <button')
  })

  it('login CTA opens the auth modal; upgrade CTA navigates to billing', () => {
    expect(resultPanelSource).toContain('setAuthModalOpen(true)')
    expect(resultPanelSource).toContain('navigate(BILLING_PATH)')
  })
})
