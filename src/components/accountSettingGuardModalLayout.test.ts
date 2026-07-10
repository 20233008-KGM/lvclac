import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('account setting guard modal skip control', () => {
  const text = source('src/components/InputPanel.tsx')

  it('imports the skip-guard localStorage helpers', () => {
    expect(text).toContain('readSkipAccountSettingGuard')
    expect(text).toContain('setSkipAccountSettingGuard')
    expect(text).toContain("} from './accountSettingGuard'")
  })

  it('short-circuits requestUnlock when the guard is skipped', () => {
    const requestUnlockBody = text.slice(
      text.indexOf('function requestUnlock()'),
      text.indexOf('function confirmUnlock()'),
    )
    expect(requestUnlockBody).toContain('readSkipAccountSettingGuard()')
    expect(requestUnlockBody).toContain('confirmUnlock()')
  })

  it('persists the skip flag from confirmUnlock when checked', () => {
    const confirmUnlockBody = text.slice(
      text.indexOf('function confirmUnlock()'),
      text.indexOf('function cancelUnlock()'),
    )
    expect(confirmUnlockBody).toContain('setSkipAccountSettingGuard(true)')
  })

  it('renders a dont-show-again checkbox reusing the draft-save skip markup', () => {
    expect(text).toContain('<label className="draft-save-skip">')
    expect(text).toContain('checked={dontShowAgain}')
    expect(text).toContain('onChange={(e) => onDontShowAgainChange(e.target.checked)}')
  })
})
