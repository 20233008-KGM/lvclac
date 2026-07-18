import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

const inputPanelSource = readFileSync(resolve('src/components/InputPanel.tsx'), 'utf8')

describe('current price tooltip copy', () => {
  it('explains initial setup and later updates in one Korean tooltip', () => {
    const hint = ko.fields.currentPrice.hint

    expect(hint).toContain('[처음 입력]')
    expect(hint).toContain('같은 시점 기준')
    expect(hint).toContain('[이후 갱신]')
    expect(hint).toContain('계좌 평가금액에 자동 반영')
    expect(hint).toContain('Ctrl+Z')
    expect(hint).toContain('[주의]')
    expect(hint).not.toContain('시나리오 가격')
  })

  it('mirrors the same unified guidance in English', () => {
    const hint = en.fields.currentPrice.hint

    expect(hint).toContain('[Initial setup]')
    expect(hint).toContain('same timestamp')
    expect(hint).toContain('[Later updates]')
    expect(hint).toContain('automatically')
    expect(hint).toContain('account equity')
    expect(hint).toContain('Ctrl+Z')
    expect(hint).toContain('[Note]')
    expect(hint).not.toContain('Scenario price')
  })

  it('uses the same localized tooltip before and after setup without changing update behavior', () => {
    expect(inputPanelSource).toContain('field={f.currentPrice}')
    expect(inputPanelSource).toContain('rollPnlOnChange={setupComplete}')
    expect(inputPanelSource).not.toContain('updateHint:')
    expect(inputPanelSource).not.toContain('hint: c.updateHint')
  })
})
