import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PRESET_IDS } from './types'
import { ko } from './locales/ko'
import { en } from './locales/en'

const mainSource = readFileSync(resolve('src/main.tsx'), 'utf8')
const contextSource = readFileSync(resolve('src/i18n/LanguageContext.tsx'), 'utf8')

describe('공개판 단일 선물 용어세트', () => {
  it('공개 프리셋 계약은 futures 하나뿐이다', () => {
    expect(PRESET_IDS).toEqual(['futures'])
    expect(Object.keys(ko.glossaryPreset.options)).toEqual(['futures'])
    expect(Object.keys(en.glossaryPreset.options)).toEqual(['futures'])
  })

  it('공개 진입점은 용어 선택기를 렌더링하지 않는다', () => {
    expect(mainSource).not.toContain('PresetSelect')
  })

  it('LanguageContext는 저장 프리셋이나 용어 오버라이드를 적용하지 않는다', () => {
    expect(contextSource).not.toContain('detectInitialPreset')
    expect(contextSource).not.toContain('persistPreset')
    expect(contextSource).not.toContain('applyPreset')
    expect(contextSource).not.toContain('getPresetOverride')
  })

  it('한영 공통 용어가 세 선물 상품군에 중립적이다', () => {
    expect(ko.fields.contractAmount.label).toBe('약정가격')
    expect(ko.fields.contractMultiplier.label).toBe('계약승수(계약크기)')
    expect(en.fields.contractAmount.label).toBe('Entry price')
    expect(en.fields.contractMultiplier.label).toBe('Contract multiplier')
  })
})
