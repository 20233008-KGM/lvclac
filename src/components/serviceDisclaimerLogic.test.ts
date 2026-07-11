import { describe, it, expect } from 'vitest'
import {
  DISCLAIMER_ACK_KEY,
  DISCLAIMER_SKIP_KEY,
  readDisclaimerAck,
  readDisclaimerSkip,
  shouldAutoShowDisclaimer,
  writeDisclaimerAck,
  writeDisclaimerSkip,
} from './serviceDisclaimerLogic'

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

describe('shouldAutoShowDisclaimer', () => {
  it('신규 방문자는 true', () => {
    expect(shouldAutoShowDisclaimer('/', store(), store())).toBe(true)
  })

  it('마이페이지·skip·ack면 false', () => {
    expect(shouldAutoShowDisclaimer('/my', store(), store())).toBe(false)
    expect(shouldAutoShowDisclaimer('/', store({ [DISCLAIMER_SKIP_KEY]: '1' }), store())).toBe(false)
    expect(shouldAutoShowDisclaimer('/', store(), store({ [DISCLAIMER_ACK_KEY]: '1' }))).toBe(false)
  })
})

describe('disclaimer write 헬퍼(환영 플로우 공유용)', () => {
  it('ack write/read 왕복(session)', () => {
    const session = store()
    expect(readDisclaimerAck(session)).toBe(false)
    writeDisclaimerAck(session)
    expect(readDisclaimerAck(session)).toBe(true)
  })

  it('skip write/read 왕복 + 해제(local)', () => {
    const local = store()
    writeDisclaimerSkip(local, true)
    expect(readDisclaimerSkip(local)).toBe(true)
    writeDisclaimerSkip(local, false)
    expect(readDisclaimerSkip(local)).toBe(false)
  })
})
