import { describe, it, expect } from 'vitest'
import {
  WELCOME_COMPLETED_KEY,
  readWelcomeCompleted,
  shouldShowWelcome,
  writeWelcomeCompleted,
} from './welcomeFlowLogic'
import { DISCLAIMER_ACK_KEY, DISCLAIMER_SKIP_KEY } from './serviceDisclaimerLogic'

function store(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => {
      m.set(k, v)
    },
    removeItem: (k: string) => {
      m.delete(k)
    },
  }
}

describe('shouldShowWelcome', () => {
  it('신규 방문자(마커 없음, 계산기 경로)에게 노출', () => {
    expect(shouldShowWelcome('/', store(), store())).toBe(true)
  })

  it('마이페이지 경로에선 미노출', () => {
    expect(shouldShowWelcome('/my', store(), store())).toBe(false)
  })

  it('온보딩 완료자 미노출', () => {
    expect(shouldShowWelcome('/', store({ [WELCOME_COMPLETED_KEY]: '1' }), store())).toBe(false)
  })

  it('기존 유저(면책 skip)에겐 미노출 — 마이그레이션 핵심', () => {
    expect(shouldShowWelcome('/', store({ [DISCLAIMER_SKIP_KEY]: '1' }), store())).toBe(false)
  })

  it('이번 세션 면책 확인자(ack) 미노출', () => {
    expect(shouldShowWelcome('/', store(), store({ [DISCLAIMER_ACK_KEY]: '1' }))).toBe(false)
  })
})

describe('welcome-completed 마커', () => {
  it('write 후 read가 true', () => {
    const local = store()
    expect(readWelcomeCompleted(local)).toBe(false)
    writeWelcomeCompleted(local)
    expect(readWelcomeCompleted(local)).toBe(true)
  })
})
