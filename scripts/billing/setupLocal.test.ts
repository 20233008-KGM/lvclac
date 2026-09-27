import { parseEnv } from 'node:util'
import { describe, expect, it } from 'vitest'
import { selectLocalBillingEnv, serializeLocalEnv } from './setupLocal'

const SOURCE = {
  PADDLE_ENV: 'live',
  APP_URL: 'https://liqguard.com',
  VITE_PADDLE_ENV: 'live',
  VITE_PADDLE_CLIENT_TOKEN: 'live_public_test',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'public-anon-test',
}

describe('local billing setup', () => {
  it('selects only public settings and the trusted read origin', () => {
    expect(selectLocalBillingEnv({
      ...SOURCE, PADDLE_API_KEY: 'secret', SUPABASE_SERVICE_ROLE_KEY: 'secret', VERCEL_OIDC_TOKEN: 'secret',
    })).toEqual({
      VITE_PADDLE_ENV: 'live', VITE_PADDLE_CLIENT_TOKEN: 'live_public_test',
      VITE_SUPABASE_URL: SOURCE.VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY: 'public-anon-test',
      BILLING_DEV_READ_ORIGIN: 'https://liqguard.com',
    })
  })

  it('reuses a protected public anon key only from the same local project', () => {
    expect(selectLocalBillingEnv({ ...SOURCE, VITE_SUPABASE_ANON_KEY: '' }, SOURCE))
      .toHaveProperty('VITE_SUPABASE_ANON_KEY', 'public-anon-test')
    expect(() => selectLocalBillingEnv({ ...SOURCE, VITE_SUPABASE_ANON_KEY: '' }, {
      ...SOURCE, VITE_SUPABASE_URL: 'https://other.supabase.co',
    })).toThrow('VITE_SUPABASE_ANON_KEY')
  })

  it('accepts a matching sandbox deployment', () => {
    expect(selectLocalBillingEnv({
      ...SOURCE, PADDLE_ENV: 'sandbox', VITE_PADDLE_ENV: 'sandbox',
      VITE_PADDLE_CLIENT_TOKEN: 'test_public', APP_URL: 'https://devpilgrm.liqguard.com/',
    })).toHaveProperty('BILLING_DEV_READ_ORIGIN', 'https://devpilgrm.liqguard.com')
  })

  it.each([
    { PADDLE_ENV: 'sandbox' },
    { VITE_PADDLE_CLIENT_TOKEN: 'test_public' },
    { APP_URL: 'https://untrusted.example' },
    { VITE_PADDLE_ENV: '' },
  ])('rejects incompatible environment settings: %j', overrides => {
    expect(() => selectLocalBillingEnv({ ...SOURCE, ...overrides })).toThrow()
  })

  it('serializes public values without changing hashes, quotes or spaces', () => {
    const values = { PUBLIC_VALUE: ' example#value" ', EMPTY: '' }
    expect(parseEnv(serializeLocalEnv(values))).toEqual(values)
  })

  it.each(['$SECRET', "single'quote", 'line\nbreak', 'line\rbreak'])('rejects unsafe dotenv syntax: %j', value => {
    expect(() => serializeLocalEnv({ KEY: value })).toThrow('Unsupported env value format')
  })

  it('rejects invalid keys', () => {
    expect(() => serializeLocalEnv({ 'INVALID=KEY': 'value' })).toThrow()
  })
})
