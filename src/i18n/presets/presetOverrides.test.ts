import { describe, it, expect } from 'vitest'
import { ko } from '../locales/ko'
import { en } from '../locales/en'
import { PRESET_IDS } from '../types'
import { koPresetOverrides } from './overrides/ko'
import { enPresetOverrides } from './overrides/en'
import type { PresetOverride } from './types'

const NAMED = PRESET_IDS.filter((id) => id !== 'default')

function keySet(o: PresetOverride): string[] {
  const fields = Object.keys(o.fields ?? {}).map((k) => `fields.${k}`)
  const results = Object.keys(o.results ?? {}).map((k) => `results.${k}`)
  return [...fields, ...results].sort()
}

describe('preset overrides 무결성', () => {
  it('ko: 모든 named 프리셋이 동일한 canonical 키 셋을 빠짐없이 덮는다', () => {
    const ref = keySet(koPresetOverrides.fx)
    expect(ref.length).toBeGreaterThan(0)
    for (const id of NAMED) {
      expect(keySet(koPresetOverrides[id]), `ko.${id} canonical mismatch`).toEqual(ref)
    }
  })

  it('ko: 모든 override 키가 실제 base(ko)에 존재한다', () => {
    for (const id of NAMED) {
      const o = koPresetOverrides[id]
      for (const k of Object.keys(o.fields ?? {})) {
        expect(ko.fields, `ko.${id}.fields.${k}`).toHaveProperty(k)
      }
      for (const k of Object.keys(o.results ?? {})) {
        expect(ko.results, `ko.${id}.results.${k}`).toHaveProperty(k)
      }
    }
  })

  it('en: override 키가 실제 base(en)에 존재하고 canonical의 부분집합이다', () => {
    const canonical = new Set(keySet(koPresetOverrides.fx))
    for (const id of NAMED) {
      const o = enPresetOverrides[id]
      for (const k of Object.keys(o.fields ?? {})) {
        expect(en.fields, `en.${id}.fields.${k}`).toHaveProperty(k)
        expect(canonical.has(`fields.${k}`), `en.${id}.fields.${k} not canonical`).toBe(true)
      }
      for (const k of Object.keys(o.results ?? {})) {
        expect(en.results, `en.${id}.results.${k}`).toHaveProperty(k)
        expect(canonical.has(`results.${k}`), `en.${id}.results.${k} not canonical`).toBe(true)
      }
    }
  })

  it('PRESET_IDS == glossaryPreset.options 키(ko/en 양쪽)', () => {
    const ids = [...PRESET_IDS].sort()
    expect(Object.keys(ko.glossaryPreset.options).sort()).toEqual(ids)
    expect(Object.keys(en.glossaryPreset.options).sort()).toEqual(ids)
  })

  it('en: 기본 계약승수 필드는 Contract multiplier로 통일한다', () => {
    expect(en.fields.contractMultiplier.label).toBe('Contract multiplier')
    expect(en.fields.contractMultiplier.hint).toMatch(/^# Contract multiplier\n/)
  })

  it('계약승수 도움말 예시는 나스닥, KOSPI200, 원자재 순서로 안내한다', () => {
    expect(ko.fields.contractMultiplier.hint).toMatch(
      /나스닥 E-mini[\s\S]*KOSPI200[\s\S]*원유/,
    )
    expect(en.fields.contractMultiplier.hint).toMatch(
      /Nasdaq E-mini[\s\S]*KOSPI200[\s\S]*crude oil/,
    )
  })
})
