import type { PresetId } from '../i18n'
import type { WelcomeRegion } from './welcomePreferences'

/**
 * 거래 상태(3단계). 계산기 로직은 불변, 어느 칸부터 채우면 되는지 시각 안내만 가른다.
 * - firstTrade: 첫 거래(계좌에 포지션 없음, 진입 계획)
 * - noPosition: 첫 거래는 아니지만 계좌에 상품 없음(경험자 진입 계획)
 * - hasPosition: 계좌에 상품 보유(현재 청산가 모니터링)
 */
export type TraderStage = 'firstTrade' | 'noPosition' | 'hasPosition'

export const TRADER_STAGES: readonly TraderStage[] = ['firstTrade', 'noPosition', 'hasPosition']

/** 증거금 입력 방식(비율/계약당/총액). CalculatorInputs.marginInputMode와 동일 유니온. */
export type MarginMode = 'rate' | 'perContract' | 'total'

export const MARGIN_MODE_IDS: readonly MarginMode[] = ['rate', 'perContract', 'total']

/** 단계: 0 환영 · 1 지역 · 2 거래종목 · 3 증거금방식 · 4 거래상태 · 5 사용법 · 6 저장 · 7 면책동의 */
export const WELCOME_STEP_COUNT = 8
export const WELCOME_LAST_STEP = WELCOME_STEP_COUNT - 1

export interface WelcomeDraft {
  step: number
  region: WelcomeRegion
  instrument: PresetId
  marginMode: MarginMode | null
  stage: TraderStage | null
  /** 이 기기에 입력값을 저장할지. null=미선택(건너뜀 시 저장하되 입력은 안 켬), true=저장, false=매번 fresh */
  saveLocal: boolean | null
  ackChecked: boolean
}

export type WelcomeAction =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'goto'; step: number }
  | { type: 'setRegion'; region: WelcomeRegion }
  | { type: 'setInstrument'; instrument: PresetId }
  | { type: 'setMargin'; marginMode: MarginMode }
  | { type: 'setStage'; stage: TraderStage }
  | { type: 'setSave'; saveLocal: boolean }
  | { type: 'setAck'; ack: boolean }

export function makeInitialDraft(region: WelcomeRegion, instrument: PresetId): WelcomeDraft {
  return {
    step: 0,
    region,
    instrument,
    marginMode: null,
    stage: null,
    saveLocal: null,
    ackChecked: false,
  }
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
    case 'setMargin':
      return { ...state, marginMode: action.marginMode }
    case 'setStage':
      return { ...state, stage: action.stage }
    case 'setSave':
      return { ...state, saveLocal: action.saveLocal }
    case 'setAck':
      return { ...state, ackChecked: action.ack }
    default:
      return state
  }
}
