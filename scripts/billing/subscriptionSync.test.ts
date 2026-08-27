import { describe, it, expect } from 'vitest'
import type { BillingDeps } from './billingConfig'
import { paddleProviderAliases, subscriptionEntitlementProviders } from './billingConfig'
import {
  customerIdOf,
  getPeriodEndIso,
  getScheduledChangeAction,
  getScheduledChangeEffectiveAtIso,
  mapPaddleStatus,
  type PaddleSubscription,
  syncSubscription,
} from './subscriptionSync'

describe('mapPaddleStatus', () => {
  it('maps allowed statuses through and folds unknown ones to inactive', () => {
    expect(mapPaddleStatus('active')).toBe('active')
    expect(mapPaddleStatus('trialing')).toBe('trialing')
    expect(mapPaddleStatus('past_due')).toBe('past_due')
    expect(mapPaddleStatus('unpaid')).toBe('unpaid')
    expect(mapPaddleStatus('canceled')).toBe('canceled')
    expect(mapPaddleStatus('paused')).toBe('inactive')
    expect(mapPaddleStatus(null)).toBe('inactive')
  })
})

describe('getPeriodEndIso', () => {
  it('reads current_billing_period.ends_at', () => {
    const sub: PaddleSubscription = {
      current_billing_period: { ends_at: '2023-11-14T22:13:20.000Z' },
    }
    expect(getPeriodEndIso(sub)).toBe('2023-11-14T22:13:20.000Z')
  })

  it('falls back to next_billed_at', () => {
    const sub: PaddleSubscription = { next_billed_at: '2027-01-02T03:04:05.000Z' }
    expect(getPeriodEndIso(sub)).toBe('2027-01-02T03:04:05.000Z')
  })

  it('returns null when unavailable', () => {
    expect(getPeriodEndIso({})).toBeNull()
  })
})

describe('Paddle environment isolation', () => {
  it('never treats a legacy sandbox row as a live subscription', () => {
    expect(paddleProviderAliases('live')).toEqual(['paddle_live'])
    expect(paddleProviderAliases('sandbox')).toEqual(['paddle_sandbox', 'paddle'])
  })

  it('accepts manual grants for entitlement checks without adding them to Paddle operations', () => {
    expect(subscriptionEntitlementProviders('live')).toEqual(['paddle_live', 'manual'])
    expect(subscriptionEntitlementProviders('sandbox')).toEqual([
      'paddle_sandbox',
      'paddle',
      'manual',
    ])
  })
})

describe('scheduled change mapping', () => {
  it('normalizes a pending cancellation', () => {
    const sub: PaddleSubscription = {
      scheduled_change: {
        action: 'cancel',
        effective_at: '2027-08-02T03:04:05.000Z',
      },
    }
    expect(getScheduledChangeAction(sub)).toBe('cancel')
    expect(getScheduledChangeEffectiveAtIso(sub)).toBe('2027-08-02T03:04:05.000Z')
  })

  it('clears absent or invalid scheduled changes', () => {
    expect(getScheduledChangeAction({ scheduled_change: null })).toBeNull()
    expect(
      getScheduledChangeEffectiveAtIso({
        scheduled_change: { action: 'cancel', effective_at: 'not-a-date' },
      }),
    ).toBeNull()
  })
})

describe('customerIdOf', () => {
  it('normalizes Paddle customer references', () => {
    expect(customerIdOf({ customer_id: 'ctm_1' })).toBe('ctm_1')
    expect(customerIdOf({ customer: { id: 'ctm_2' } })).toBe('ctm_2')
    expect(customerIdOf(null)).toBeNull()
  })
})

interface FakeState {
  updates: Record<string, unknown>[]
  inserts: Record<string, unknown>[]
}

function makeDeps(
  existingRow: { id: string; provider_event_time: string | null } | null,
  state: FakeState,
): BillingDeps {
  const admin = {
    from() {
      return {
        select() {
          return this
        },
        eq() {
          return this
        },
        in() {
          return this
        },
        order() {
          return this
        },
        limit() {
          return this
        },
        async maybeSingle() {
          return { data: existingRow, error: null }
        },
        update(patch: Record<string, unknown>) {
          state.updates.push(patch)
          return {
            eq() {
              return this
            },
            or() {
              return this
            },
            error: null,
          }
        },
        async insert(row: Record<string, unknown>) {
          state.inserts.push(row)
          return { error: null }
        },
      }
    },
  }
  return { admin, fetch: async () => ({}) } as unknown as BillingDeps
}

describe('syncSubscription', () => {
  const baseSub: PaddleSubscription = {
    id: 'sub_1',
    customer_id: 'ctm_1',
    status: 'active',
    current_billing_period: { ends_at: '2023-11-14T22:13:20.000Z' },
    scheduled_change: {
      action: 'cancel',
      effective_at: '2023-11-14T22:13:20.000Z',
    },
    custom_data: {},
  }

  it('inserts a new row when none exists', async () => {
    const state: FakeState = { updates: [], inserts: [] }
    const deps = makeDeps(null, state)
    const result = await syncSubscription(
      deps,
      baseSub,
      'user-1',
      'live',
      '2023-11-14T22:13:20.000Z',
    )

    expect(result.ok).toBe(true)
    expect(state.inserts).toHaveLength(1)
    expect(state.inserts[0]).toMatchObject({
      user_id: 'user-1',
      provider: 'paddle_live',
      provider_customer_id: 'ctm_1',
      provider_subscription_id: 'sub_1',
      status: 'active',
      scheduled_change_action: 'cancel',
      scheduled_change_effective_at: '2023-11-14T22:13:20.000Z',
      provider_event_time: '2023-11-14T22:13:20.000Z',
    })
  })

  it('updates an existing row', async () => {
    const state: FakeState = { updates: [], inserts: [] }
    const deps = makeDeps({ id: 'row-9', provider_event_time: null }, state)
    const result = await syncSubscription(
      deps,
      baseSub,
      'user-1',
      'sandbox',
      '2023-11-14T22:13:20.000Z',
    )

    expect(result.ok).toBe(true)
    expect(state.updates).toHaveLength(1)
    expect(state.updates[0]).toMatchObject({
      provider: 'paddle_sandbox',
      status: 'active',
      provider_subscription_id: 'sub_1',
      scheduled_change_action: 'cancel',
      scheduled_change_effective_at: '2023-11-14T22:13:20.000Z',
      provider_event_time: '2023-11-14T22:13:20.000Z',
    })
    expect(state.inserts).toHaveLength(0)
  })

  it('skips an out-of-order webhook that is older than stored state', async () => {
    const state: FakeState = { updates: [], inserts: [] }
    const deps = makeDeps(
      { id: 'row-9', provider_event_time: '2023-11-15T00:00:00.000Z' },
      state,
    )
    const result = await syncSubscription(
      deps,
      baseSub,
      'user-1',
      'live',
      '2023-11-14T22:13:20.000Z',
    )

    expect(result).toEqual({ ok: true, skipped: true })
    expect(state.updates).toHaveLength(0)
    expect(state.inserts).toHaveLength(0)
  })

  it('skips when user cannot be resolved', async () => {
    const state: FakeState = { updates: [], inserts: [] }
    const orphan: PaddleSubscription = { ...baseSub, customer_id: null, custom_data: {} }
    const deps = makeDeps(null, state)
    const result = await syncSubscription(deps, orphan, null, 'live')

    expect(result).toEqual({ ok: true, skipped: true })
    expect(state.inserts).toHaveLength(0)
    expect(state.updates).toHaveLength(0)
  })
})
