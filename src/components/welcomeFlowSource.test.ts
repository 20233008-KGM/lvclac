import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// 이 프로젝트 Vitest 환경엔 DOM 하니스가 없어(overlayPortalLayout.test.ts 관례),
// 모달의 접근성/게이트 배선은 소스 텍스트 검증으로 보장한다.
const welcome = readFileSync(resolve('src/components/WelcomeFlow.tsx'), 'utf8')
const provider = readFileSync(resolve('src/components/ServiceDisclaimer.tsx'), 'utf8')

describe('WelcomeFlow 접근성/구조', () => {
  it('dialog 접근성 속성', () => {
    expect(welcome).toContain('role="dialog"')
    expect(welcome).toContain('aria-modal="true"')
    expect(welcome).toContain('aria-labelledby="welcome-step-title"')
  })

  it('포커스 복원 훅 + 배경 스크롤 잠금', () => {
    expect(welcome).toContain('useModalFocusRestore()')
    expect(welcome).toContain("document.body.style.overflow = 'hidden'")
  })

  it('필수 관문: backdrop 클릭 닫기 없음', () => {
    // 닫히는 오버레이(LegalOverlay)는 e.target === e.currentTarget 패턴을 쓴다 — 없어야 함
    expect(welcome).not.toContain('e.target === e.currentTarget')
  })

  it('완료 시 지역→시간대 저장 + ack 체크 전 시작 불가', () => {
    expect(welcome).toContain('writePreferredSnapshotTimeZone(regionToTimeZone(draft.region))')
    expect(welcome).toContain('disabled={!draft.ackChecked}')
  })
})

describe('DisclaimerProvider 게이트 배선', () => {
  it('welcome XOR disclaimer 배타 렌더', () => {
    expect(provider).toContain('welcomeOpen ?')
    expect(provider).toContain('<WelcomeFlow onComplete={handleWelcomeComplete} />')
  })

  it('완료 시 면책 ack/skip + 온보딩 완료 플래그 커밋', () => {
    expect(provider).toContain('writeDisclaimerAck(sessionStorage)')
    expect(provider).toContain('writeDisclaimerSkip(localStorage, true)')
    expect(provider).toContain('writeWelcomeCompleted(localStorage)')
  })
})
