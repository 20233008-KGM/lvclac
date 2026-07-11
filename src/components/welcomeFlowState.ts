import type { PresetId } from '../i18n'
import type { WelcomeRegion } from './welcomePreferences'

/** 거래 상태: 첫 주문 전(포지션 없음) vs 이미 포지션 보유. 안내 문구만 가른다(계산기 불변). */
export type TraderStage = 'firstTrade' | 'hasPosition'

/** 단계: 0 환영 · 1 지역 · 2 거래종목 · 3 거래상태 · 4 사용법 · 5 면책동의 */
export const WELCOME_STEP_COUNT = 6
export const WELCOME_LAST_STEP = WELCOME_STEP_COUNT - 1

export interface WelcomeDraft {
  step: number
  region: WelcomeRegion
  instrument: PresetId
  stage: TraderStage | null
  ackChecked: boolean
}

export type WelcomeAction =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'goto'; step: number }
  | { type: 'setRegion'; region: WelcomeRegion }
  | { type: 'setInstrument'; instrument: PresetId }
  | { type: 'setStage'; stage: TraderStage }
  | { type: 'setAck'; ack: boolean }

export function makeInitialDraft(region: WelcomeRegion, instrument: PresetId): WelcomeDraft {
  return { step: 0, region, instrument, stage: null, ackChecked: false }
}

function clampStep(step: number): number {
  if (step < 0) return 0
  if (step > WELCOME_LAST_STEP) return WELCOME_LAST_STEP
  return step
}

export function welcomeReducer(state: WelcomeDraft, action: WelcomeAction): WelcomeDraft {
  switch (action.type) {
    case 'next':
      return { ...state, step: clampStep(state.step + 1) }
    case 'back':
      return { ...state, step: clampStep(state.step - 1) }
    case 'goto':
      return { ...state, step: clampStep(action.step) }
    case 'setRegion':
      return { ...state, region: action.region }
    case 'setInstrument':
      return { ...state, instrument: action.instrument }
    case 'setStage':
      return { ...state, stage: action.stage }
    case 'setAck':
      return { ...state, ackChecked: action.ack }
    default:
      return state
  }
}
