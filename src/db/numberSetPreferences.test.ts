import { describe, expect, it } from 'vitest'
import { createNumberSetPreferencesRepository } from './numberSetPreferences'

function preferenceClient(result: {
  data: { active_cloud_number_set_id: string | null } | null
  error: { message: string } | null
}) {
  const seen: Array<{ operation: string; value?: string | null; userId?: string }> = []
  const builder = {
    select() {
      if (!seen.length) seen.push({ operation: 'select' })
      return builder
    },
    update(value: { active_cloud_number_set_id: string | null }) {
      seen.push({ operation: 'update', value: value.active_cloud_number_set_id })
      return builder
    },
    eq(_column: string, userId: string) {
      seen[seen.length - 1].userId = userId
      return builder
    },
    maybeSingle() {
      return Promise.resolve(result)
    },
  }
  return {
    seen,
    from() {
      return builder
    },
  }
}

describe('active cloud number-set preference repository', () => {
  it('fetches the account-scoped active set', async () => {
    const fake = preferenceClient({
      data: { active_cloud_number_set_id: 'set-a' },
      error: null,
    })
    await expect(
      createNumberSetPreferencesRepository(fake as never).fetchActive('user-1'),
    ).resolves.toEqual({ data: 'set-a', error: null })
    expect(fake.seen).toEqual([{ operation: 'select', userId: 'user-1' }])
  })

  it('saves a selection or clears it explicitly', async () => {
    const saveFake = preferenceClient({
      data: { active_cloud_number_set_id: 'set-b' },
      error: null,
    })
    await expect(
      createNumberSetPreferencesRepository(saveFake as never).saveActive('user-1', 'set-b'),
    ).resolves.toEqual({ data: 'set-b', error: null })
    expect(saveFake.seen[0]).toEqual({ operation: 'update', value: 'set-b', userId: 'user-1' })

    const clearFake = preferenceClient({
      data: { active_cloud_number_set_id: null },
      error: null,
    })
    await expect(
      createNumberSetPreferencesRepository(clearFake as never).saveActive('user-1', null),
    ).resolves.toEqual({ data: null, error: null })
  })

  it('reports database errors and a missing profile row', async () => {
    const failed = preferenceClient({ data: null, error: { message: 'write failed' } })
    await expect(
      createNumberSetPreferencesRepository(failed as never).saveActive('user-1', 'set-a'),
    ).resolves.toEqual({ data: null, error: 'write failed' })

    const missing = preferenceClient({ data: null, error: null })
    await expect(
      createNumberSetPreferencesRepository(missing as never).saveActive('user-1', 'set-a'),
    ).resolves.toEqual({ data: null, error: 'profile_not_found' })
  })
})
