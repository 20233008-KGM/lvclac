import { describe, expect, it } from 'vitest'
import {
  AD_MIN_VISIBLE,
  EXPAND_SPLIT_STEP,
  MAX_EXPAND_STEPS,
  MIN_CALC_MID_FALLBACK,
  computeExpandLayout,
  computeExpandStep,
  isLayoutCustom,
  scaleGeometry,
  scaleGridLayout,
  sideVars,
  type Geometry,
  type GridLayout,
} from './gridLayoutUtils'

const geo: Geometry = {
  adW: 160,
  outerL: 40,
  innerL: 20,
  outerR: 40,
  innerR: 20,
  leftX0: 220,
  rightX0: 220,
}

const base: GridLayout = { leftX: null, rightX: null, split: 0.5, manual: false }

describe('gridLayoutUtils', () => {
  it('isLayoutCustom — manual 또는 split/gap 변경 시 true', () => {
    expect(isLayoutCustom(base)).toBe(false)
    expect(isLayoutCustom({ ...base, manual: true })).toBe(true)
    expect(isLayoutCustom({ ...base, split: 0.6 })).toBe(true)
    expect(isLayoutCustom({ ...base, leftX: 200 })).toBe(true)
  })

  it('computeExpandLayout — 입력 오버플로를 한 번에 split 조정', () => {
    const midWidth = 800
    const steps = 3
    const overflow = midWidth * EXPAND_SPLIT_STEP * steps
    const step = computeExpandLayout(base, geo, overflow, 0, midWidth)
    expect(step.changed).toBe(true)
    expect(step.layout.split).toBeCloseTo(0.5 + EXPAND_SPLIT_STEP * steps, 5)
    expect(step.widened).toBe(false)
  })

  it('computeExpandLayout — MAX_EXPAND_STEPS 이내로 제한', () => {
    const midWidth = 800
    const overflow = midWidth * EXPAND_SPLIT_STEP * 20
    const step = computeExpandLayout(base, geo, overflow, 0, midWidth)
    expect(step.changed).toBe(true)
    expect(step.layout.split).toBeCloseTo(0.5 + EXPAND_SPLIT_STEP * MAX_EXPAND_STEPS, 5)
  })

  it('computeExpandStep — 입력 오버플로 시 split 증가', () => {
    const step = computeExpandStep(base, geo, 10, 0)
    expect(step.changed).toBe(true)
    expect(step.layout.split).toBeGreaterThan(0.5)
    expect(step.widened).toBe(false)
  })

  it('computeExpandStep — manual이면 변경 없음', () => {
    const step = computeExpandStep({ ...base, manual: true }, geo, 100, 100)
    expect(step.changed).toBe(false)
  })

  it('computeExpandStep — 양쪽 오버플로 시 gap 확장', () => {
    const tight: GridLayout = { leftX: 220, rightX: 220, split: 0.5, manual: false }
    const step = computeExpandStep(tight, geo, 50, 50)
    expect(step.changed).toBe(true)
    expect(step.widened).toBe(true)
    expect(step.layout.leftX).toBeLessThan(220)
  })

  it('sideVars — 광고 폭 축소 구간', () => {
    const shrunk = sideVars(100, geo.adW, geo.outerL)
    expect(shrunk).toEqual({ outer: 0, inner: 0, adW: 100, hidden: false })

    const atMin = sideVars(AD_MIN_VISIBLE, geo.adW, geo.outerL)
    expect(atMin).toEqual({
      outer: AD_MIN_VISIBLE,
      inner: 0,
      adW: 0,
      hidden: true,
    })

    const belowMin = sideVars(20, geo.adW, geo.outerL)
    expect(belowMin).toEqual({
      outer: AD_MIN_VISIBLE,
      inner: 0,
      adW: 0,
      hidden: true,
    })
  })

  it('sideVars — 기본 gap 구간', () => {
    const normal = sideVars(geo.leftX0, geo.adW, geo.outerL)
    expect(normal.adW).toBe(geo.adW)
    expect(normal.hidden).toBe(false)
    expect(normal.outer).toBe(geo.outerL)
    expect(normal.inner).toBe(geo.innerL)
  })

  it('sideVars — 숨김 후에도 계산기 가장자리 위치 유지', () => {
    const visible = sideVars(AD_MIN_VISIBLE + 1, geo.adW, geo.outerL)
    const hidden = sideVars(0, geo.adW, geo.outerL)
    const edge = (v: { outer: number; inner: number; adW: number }) => v.outer + v.inner + v.adW
    expect(edge(visible)).toBe(AD_MIN_VISIBLE + 1)
    expect(edge(hidden)).toBe(AD_MIN_VISIBLE)
  })

  it('sideVars — edgeFloor:0 (수동 리사이즈) 시 outer가 x를 따름', () => {
    const opts = { edgeFloor: 0 }
    expect(sideVars(0, geo.adW, geo.outerL, opts)).toEqual({
      outer: 0,
      inner: 0,
      adW: 0,
      hidden: true,
    })
    expect(sideVars(20, geo.adW, geo.outerL, opts)).toEqual({
      outer: 20,
      inner: 0,
      adW: 0,
      hidden: true,
    })
    expect(sideVars(AD_MIN_VISIBLE, geo.adW, geo.outerL, opts)).toEqual({
      outer: AD_MIN_VISIBLE,
      inner: 0,
      adW: 0,
      hidden: true,
    })
  })

  it('MIN_CALC_MID_FALLBACK — measureMinCalculatorMid 실패 시 사용', () => {
    expect(MIN_CALC_MID_FALLBACK).toBeGreaterThanOrEqual(80)
  })

  it('computeExpandStep — gap 소진 후 광고 축소', () => {
    const atAdWall: GridLayout = { leftX: geo.adW, rightX: geo.adW, split: 0.5, manual: false }
    const step = computeExpandStep(atAdWall, geo, 50, 50)
    expect(step.changed).toBe(true)
    expect(step.widened).toBe(true)
    expect(step.layout.leftX).toBeLessThan(geo.adW)
    expect(step.layout.rightX).toBeLessThan(geo.adW)
  })

  it('scaleGeometry — 줌 비율에 맞춰 좌표만 보정하고 adW는 유지', () => {
    const scaled = scaleGeometry(geo, 0.8)
    expect(scaled.adW).toBe(geo.adW)
    expect(scaled.leftX0).toBeCloseTo(geo.leftX0 * 0.8, 3)
    expect(scaled.outerL).toBeCloseTo(geo.outerL * 0.8, 3)
  })

  it('scaleGridLayout — 커스텀 gap 좌표를 뷰포트 비율로 보정', () => {
    const custom: GridLayout = { leftX: 200, rightX: 180, split: 0.55, manual: false }
    const scaled = scaleGridLayout(custom, 1.25)
    expect(scaled.leftX).toBeCloseTo(250, 3)
    expect(scaled.rightX).toBeCloseTo(225, 3)
    expect(scaled.split).toBe(0.55)
  })
})
