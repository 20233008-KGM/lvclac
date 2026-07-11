import { describe, it, expect } from 'vitest'
import {
  WELCOME_LAST_STEP,
  WELCOME_STEP_COUNT,
  makeInitialDraft,
  welcomeReducer,
} from './welcomeFlowState'

const init = () => makeInitialDraft('KR', 'index')

describe('welcomeReducer', () => {
  it('WELCOME_STEP_COUNT는 6, LAST는 5', () => {
    expect(WELCOME_STEP_COUNT).toBe(6)
    expect(WELCOME_LAST_STEP).toBe(5)
  })

  it('next는 마지막 단계에서 clamp', () => {
    let s = init()
    for (let i = 0; i < 20; i++) s = welcomeReducer(s, { type: 'next' })
    expect(s.step).toBe(WELCOME_LAST_STEP)
  })

  it('back은 0에서 clamp', () => {
    expect(welcomeReducer(init(), { type: 'back' }).step).toBe(0)
  })

  it('goto는 범위 밖 값을 clamp', () => {
    expect(welcomeReducer(init(), { type: 'goto', step: 99 }).step).toBe(WELCOME_LAST_STEP)
    expect(welcomeReducer(init(), { type: 'goto', step: -5 }).step).toBe(0)
    expect(welcomeReducer(init(), { type: 'goto', step: 3 }).step).toBe(3)
  })

  it('선택값을 반영하고 step은 유지', () => {
    let s = init()
    s = welcomeReducer(s, { type: 'setRegion', region: 'US' })
    s = welcomeReducer(s, { type: 'setInstrument', instrument: 'fx' })
    s = welcomeReducer(s, { type: 'setStage', stage: 'hasPosition' })
    s = welcomeReducer(s, { type: 'setAck', ack: true })
    expect(s).toMatchObject({
      step: 0,
      region: 'US',
      instrument: 'fx',
      stage: 'hasPosition',
      ackChecked: true,
    })
  })

  it('초기 draft', () => {
    expect(makeInitialDraft('US', 'default')).toEqual({
      step: 0,
      region: 'US',
      instrument: 'default',
      stage: null,
      ackChecked: false,
    })
  })
})
