import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ko } from '../i18n/locales/ko'

// 이 프로젝트 Vitest 환경엔 DOM 하니스가 없어(overlayPortalLayout.test.ts 관례),
// 모달의 접근성/게이트 배선은 소스 텍스트 검증으로 보장한다.
const welcome = readFileSync(resolve('src/components/WelcomeFlow.tsx'), 'utf8')
const provider = readFileSync(resolve('src/components/ServiceDisclaimer.tsx'), 'utf8')
const app = readFileSync(resolve('src/App.tsx'), 'utf8')

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

  it('환영·거래상황·맞춤 사용법을 각각 별도 단계로 렌더', () => {
    const greetingStart = welcome.indexOf('{stepIndex === 0 && (')
    const regionStart = welcome.indexOf('{stepIndex === 1 && (')
    const stageStart = welcome.indexOf('{stepIndex === 3 && (')
    const usageStart = welcome.indexOf('{stepIndex === 4 && (')
    const saveStart = welcome.indexOf('{stepIndex === 5 && (')

    expect(greetingStart).toBeGreaterThan(-1)
    expect(welcome.slice(greetingStart, regionStart)).toContain('welcome-intro')
    expect(welcome.slice(stageStart, usageStart)).not.toContain('welcome-usage')
    expect(welcome.slice(usageStart, saveStart)).toContain('welcome-usage')
    expect(welcome.slice(usageStart, saveStart)).toContain('<ol className="welcome-usage__list">')
    expect(welcome.slice(usageStart, saveStart)).toContain("draft.stage === 'hasPosition'")
    expect(welcome.slice(usageStart, saveStart)).toContain('usageCaptureBody')
  })

  it('보유 포지션 사용법에 같은 화면 캡처 안내를 제공', () => {
    expect(ko.welcome.usageCaptureBody).toContain('계좌평가금액과 현재가는 가능하면 한 화면에서 캡처')
    expect(ko.welcome.usageCaptureBody).toContain('증권사의 종합잔고 페이지')
  })

  it('미방문 단계 우회 차단 + 전체 단계 수 기반 진행선', () => {
    expect(welcome).toContain('disabled={i > furthestStep}')
    expect(welcome).toContain('stepIndex / WELCOME_LAST_STEP')
  })
})

describe('DisclaimerProvider 게이트 배선', () => {
  it('신규 방문자는 CTA를 먼저 보고 직접 WelcomeFlow를 열며, 면책 모달과 배타 렌더', () => {
    expect(provider).toContain('const [welcomeOpen, setWelcomeOpen] = useState(false)')
    expect(provider).toContain('const [welcomePending, setWelcomePending] = useState')
    expect(provider).toContain('const showWelcome = () =>')
    expect(provider).toContain('welcomePending, showWelcome')
    expect(provider).toContain('welcomeOpen ?')
    expect(provider).toContain('<WelcomeFlow onComplete={handleWelcomeComplete} />')
  })

  it('완료 시 면책 ack/skip + 온보딩 완료 플래그 커밋', () => {
    expect(provider).toContain('writeDisclaimerAck(sessionStorage)')
    expect(provider).toContain('writeDisclaimerSkip(localStorage, true)')
    expect(provider).toContain('writeWelcomeCompleted(localStorage)')
    expect(provider).toContain('setWelcomePending(false)')
  })

  it('헤더에서 신규 방문 CTA를 기존 사용법 자리에 교체하고 로그인 버튼은 유지', () => {
    expect(app).toContain('firstVisitWelcome?.welcomePending ?')
    expect(app).toContain('className="header-welcome-btn"')
    expect(app).toContain('onClick={firstVisitWelcome.showWelcome}')
    expect(app.indexOf('className="header-welcome-btn"')).toBeLessThan(
      app.indexOf('<HowToUseButton'),
    )
    expect(app.indexOf('<HowToUseButton')).toBeLessThan(
      app.indexOf('<AuthButton variant="header" />'),
    )
  })
})
