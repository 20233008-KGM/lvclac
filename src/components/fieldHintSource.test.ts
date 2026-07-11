import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// 필드 하이라이트는 TSX의 fh-* 클래스 ↔ App.css의 [data-field-hint] 셀렉터가
// 이름으로 맞물려 동작한다. 한쪽만 바뀌면 조용히 깨지므로 소스 텍스트로 계약을 고정한다.
const app = readFileSync(resolve('src/App.tsx'), 'utf8')
const input = readFileSync(resolve('src/components/InputPanel.tsx'), 'utf8')
const result = readFileSync(resolve('src/components/ResultPanel.tsx'), 'utf8')
const css = readFileSync(resolve('src/App.css'), 'utf8')

const FIELD_CLASSES = ['fh-equity', 'fh-entry', 'fh-contracts', 'fh-mark', 'fh-mult', 'fh-margin']

describe('field hint 배선 (클래스 계약)', () => {
  it('App: data-field-hint 속성 + 배너 렌더', () => {
    expect(app).toContain('data-field-hint=')
    expect(app).toContain('<FieldHintBanner')
  })

  it('InputPanel: 핵심 입력 필드에 fh-* 클래스', () => {
    for (const c of FIELD_CLASSES) {
      expect(input, `InputPanel missing ${c}`).toContain(c)
    }
  })

  it('ResultPanel: 주문 필드 래퍼에 fh-order', () => {
    expect(result).toContain('fh-order')
  })

  it('App.css: 모든 fh-* 클래스와 3단계 셀렉터 존재', () => {
    for (const c of [...FIELD_CLASSES, 'fh-order']) {
      expect(css, `CSS missing ${c}`).toContain(c)
    }
    for (const s of ['firstTrade', 'noPosition', 'hasPosition']) {
      expect(css, `CSS missing selector ${s}`).toContain(`[data-field-hint='${s}']`)
    }
  })
})
