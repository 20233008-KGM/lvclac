import { describe, expect, it } from 'vitest'
import {
  assertPublicLaunchReady,
  missingPublicOperatorEnv,
  REQUIRED_PUBLIC_OPERATOR_ENV,
} from './publicLaunchValidation'

const completeOperator = Object.fromEntries(
  REQUIRED_PUBLIC_OPERATOR_ENV.map((key) => [key, `value-for-${key}`]),
)

describe('public launch validation', () => {
  it('allows private pre-launch builds without legal values', () => {
    expect(() => assertPublicLaunchReady({ ALLOW_INDEXING: 'false' })).not.toThrow()
  })

  it('requires verified operator values for indexing or AdSense', () => {
    expect(() => assertPublicLaunchReady({ ALLOW_INDEXING: 'true' })).toThrow(
      'VITE_PUBLIC_OPERATOR_LEGAL_NAME',
    )
    expect(() => assertPublicLaunchReady({ VITE_ADSENSE_CLIENT: 'ca-pub-123' })).toThrow(
      'VITE_PUBLIC_OPERATOR_REPRESENTATIVE',
    )
  })

  it('accepts a complete public operator profile', () => {
    const env = { ...completeOperator, ALLOW_INDEXING: 'true' }
    expect(missingPublicOperatorEnv(env)).toEqual([])
    expect(() => assertPublicLaunchReady(env)).not.toThrow()
  })
})
