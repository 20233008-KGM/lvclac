import { describe, expect, it } from 'vitest'
import { defaultInputs } from '../types'
import { SAFE_PRECISION_MAX } from './format'
import { sanitizeDraftInputs } from './sanitizeDraftInputs'

describe('sanitizeDraftInputs', () => {
  it('NaN·Infinity 숫자 필드는 undefined로 정리', () => {
    const result = sanitizeDraftInputs({
      ...defaultInputs,
      accountEval: Number.NaN,
      contracts: Number.POSITIVE_INFINITY,
    })
    expect(result.accountEval).toBeUndefined()
    expect(result.contracts).toBeUndefined()
  })

  it('exceedsSafePrecision 값은 그대로 보존', () => {
    const large = SAFE_PRECISION_MAX + 1
    const result = sanitizeDraftInputs({
      ...defaultInputs,
      accountEval: large,
    })
    expect(result.accountEval).toBe(large)
  })

  it('손상된 시나리오 스냅샷은 제거', () => {
    const result = sanitizeDraftInputs({
      ...defaultInputs,
      scenarioRevertSnapshot: {
        accountEval: Number.NaN,
      },
    })
    expect(result.scenarioRevertSnapshot).toBeUndefined()
  })
})
