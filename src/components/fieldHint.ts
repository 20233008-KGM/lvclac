import type { TraderStage } from './welcomeFlowState'

/** 온보딩에서 고른 거래 상태(첫 거래/무포지션/보유). 계산기 필드 인디케이터 분기에 쓴다. */
export const TRADER_STAGE_KEY = 'leverage_trader_stage'
/** 필드 인디케이터를 사용자가 닫았는지(영구). */
export const FIELD_HINT_DISMISSED_KEY = 'leverage_field_hint_dismissed'

const STAGES: readonly string[] = ['firstTrade', 'noPosition', 'hasPosition']

export function readTraderStage(): TraderStage | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(TRADER_STAGE_KEY)
    return v && STAGES.includes(v) ? (v as TraderStage) : null
  } catch {
    return null
  }
}

export function writeTraderStage(stage: TraderStage): void {
  try {
    localStorage.setItem(TRADER_STAGE_KEY, stage)
  } catch {
    // ignore
  }
}

export function readFieldHintDismissed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(FIELD_HINT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function writeFieldHintDismissed(): void {
  try {
    localStorage.setItem(FIELD_HINT_DISMISSED_KEY, '1')
  } catch {
    // ignore
  }
}

/** 인디케이터를 띄울지: 거래 상태가 있고 아직 닫지 않았을 때. */
export function fieldHintActive(stage: TraderStage | null, dismissed: boolean): boolean {
  return stage != null && !dismissed
}
