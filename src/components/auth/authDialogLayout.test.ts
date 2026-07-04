import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve('src/styles/auth-dialog.css'), 'utf8')

function blockFor(selector: string) {
  const match = css.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]+)\\}`))
  return match?.[1] ?? ''
}

describe('auth dialog layout CSS', () => {
  it('keeps the modal shell aligned with the card so the close button stays inside', () => {
    expect(blockFor('.auth-card')).toContain('max-width: 420px')
    expect(blockFor('.auth-modal')).toContain('width: min(100%, 420px)')
  })
})
