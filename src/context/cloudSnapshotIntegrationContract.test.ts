import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('cloud snapshot integration contract', () => {
  it('restores the account-scoped snapshot before checking the lightweight server revision', () => {
    const calculator = source('src/context/CalculatorContext.tsx')
    const cacheRead = calculator.indexOf('readCloudNumberSetSnapshot(localStorage, activeUserId)')
    const revisionRead = calculator.indexOf('fetchCloudNumberSetRevisionState(', cacheRead)
    const fullRead = calculator.lastIndexOf('fetchResolvedCloudNumberSetState(activeUserId)')

    expect(cacheRead).toBeGreaterThan(0)
    expect(revisionRead).toBeGreaterThan(cacheRead)
    expect(fullRead).toBeGreaterThan(revisionRead)
    expect(calculator).toContain('cloudSnapshotMatchesRevision(')
  })

  it('revalidates on calculator route return without remounting the provider', () => {
    const calculator = source('src/context/CalculatorContext.tsx')
    expect(calculator).toContain("window.location.pathname === '/'")
    expect(calculator).toContain("window.addEventListener('popstate', requestCloudRevalidation)")
    expect(calculator).toContain('cloudRevalidateNonce,')
  })

  it('does not let My Page issue its own duplicate number-set list request', () => {
    const myPage = source('src/components/MyPage.tsx')
    expect(myPage).not.toContain('fetchNumberSets')
    expect(myPage).toContain('hasCloudDraft,')
    expect(myPage).toContain('onClick={onBackToCalculator}')
    expect(myPage).toContain("navigate('/')")
  })

  it('clears the signed-in account snapshot before sign-out', () => {
    const auth = source('src/context/AuthContext.tsx')
    const clear = auth.indexOf('clearCloudNumberSetSnapshot(localStorage, signedOutUserId)')
    const signOut = auth.indexOf('await supabase.auth.signOut()', clear)
    expect(clear).toBeGreaterThan(0)
    expect(signOut).toBeGreaterThan(clear)
  })
})
