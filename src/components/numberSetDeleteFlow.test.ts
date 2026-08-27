import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/MyPage.tsx'), 'utf8')

function callbackBody(name: string, nextName: string): string {
  const start = source.indexOf(`const ${name} = useCallback`)
  const end = source.indexOf(`const ${nextName} = useCallback`, start + 1)
  expect(start).toBeGreaterThan(-1)
  expect(end).toBeGreaterThan(start)
  return source.slice(start, end)
}

describe('MyPage number-set deletion flow', () => {
  it('opens the warning and loads a summary without deleting on the first click', () => {
    const handler = callbackBody('handleDeleteNumberSet', 'handleCloseNumberSetDelete')
    expect(handler).toContain('setNumberSetDeleteTarget(nextTarget)')
    expect(handler).toContain('loadNumberSetDeleteSummary(nextTarget)')
    expect(handler).not.toContain('deleteNumberSetById')
  })

  it('retries only the cloud summary after a failed preview', () => {
    const retry = callbackBody('handleRetryNumberSetDelete', 'handleConfirmNumberSetDelete')
    expect(retry).toContain("numberSetDeleteTarget.mode !== 'cloud'")
    expect(retry).toContain('loadNumberSetDeleteSummary(numberSetDeleteTarget)')
  })

  it('deletes only after a ready cloud summary and ignores duplicate clicks', () => {
    const confirm = callbackBody('handleConfirmNumberSetDelete', 'handleSetNumberSetAutoSnapshot')
    expect(confirm).toContain('numberSetActionBusyRef.current')
    expect(confirm).toContain("numberSetDeleteSummary.status !== 'ready'")
    expect(confirm).toContain('!numberSetDeleteSummary.summary')
    expect(confirm).toContain('deleteNumberSetById(target.mode, target.id)')
    expect(confirm).toContain('numberSetDeleteSuccess')
  })

  it('uses a simple ready state for local deletion without a summary request', () => {
    const loader = callbackBody('loadNumberSetDeleteSummary', 'handleDeleteNumberSet')
    const localBranch = loader.slice(loader.indexOf("target.mode === 'local'"), loader.indexOf('if (!user)'))
    expect(localBranch).toContain("status: 'ready', summary: null")
    expect(localBranch).not.toContain('fetchNumberSetDeletionSummary')
  })
})
