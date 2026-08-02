import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('startup performance contract', () => {
  it('uses the initial auth event as the single session bootstrap source', () => {
    const auth = source('src/context/AuthContext.tsx')

    expect(auth).toContain("event === 'INITIAL_SESSION'")
    expect(auth).toContain('shouldHydrateAuthSession')
    expect(auth).not.toContain('supabase.auth\n      .getSession()')
  })

  it('starts cloud restoration from session readiness instead of full account hydration', () => {
    const calculator = source('src/context/CalculatorContext.tsx')

    expect(calculator).toContain('sessionUserId ?? user?.id ?? null')
    expect(calculator).toContain('if (sessionLoading) return')
    expect(calculator).toContain('storageBootstrapPendingRef.current')
    expect(calculator).not.toContain('loading: authLoading')
  })

  it('does not rewrite an unchanged profile email during every startup', () => {
    const profile = source('src/db/profile.ts')

    expect(profile).toContain("select('nickname, auto_save_order_history, email')")
    expect(profile).toContain('existing.data?.email !== email')
  })

  it('keeps hashed Vite assets immutable for repeat visits', () => {
    const config = JSON.parse(source('vercel.json')) as {
      headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>
    }
    const assets = config.headers?.find((entry) => entry.source === '/assets/(.*)')

    expect(assets?.headers).toContainEqual({
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    })
  })
})
