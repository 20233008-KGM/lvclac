import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

describe('margin rate tooltip copy', () => {
  it('briefly distinguishes maintenance margin from initial margin in Korean', () => {
    expect(ko.fields.maintenanceMarginRate.hint).toContain('포지션을 계속 보유')
    expect(ko.fields.maintenanceMarginRate.hint).toContain('마진콜·청산')
    expect(ko.fields.entrustedMarginRate.hint).toContain('새 포지션을 열 때')
    expect(ko.fields.entrustedMarginRate.hint).toContain('유지증거금률보다 높습니다')
  })

  it('keeps the same concepts in English', () => {
    expect(en.fields.maintenanceMarginRate.hint).toContain('keep a position open')
    expect(en.fields.maintenanceMarginRate.hint).toContain('margin call or liquidation')
    expect(en.fields.entrustedMarginRate.hint).toContain('opening a new position')
    expect(en.fields.entrustedMarginRate.hint).toContain('higher than the maintenance margin rate')
  })
})
