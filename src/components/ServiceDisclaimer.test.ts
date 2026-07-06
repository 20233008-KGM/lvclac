import { describe, expect, it, vi } from 'vitest'
import { MY_PAGE_PATH } from '../config/routes'
import { shouldAutoShowDisclaimer } from './serviceDisclaimerLogic'

describe('shouldAutoShowDisclaimer', () => {
  it('does not auto-open the calculator disclaimer on my page', () => {
    const storage = { getItem: vi.fn(() => null) }

    expect(shouldAutoShowDisclaimer(MY_PAGE_PATH, storage, storage)).toBe(false)
    expect(shouldAutoShowDisclaimer(`${MY_PAGE_PATH}/`, storage, storage)).toBe(false)
  })

  it('still auto-opens on calculator routes when no acknowledgement exists', () => {
    const storage = { getItem: vi.fn(() => null) }

    expect(shouldAutoShowDisclaimer('/', storage, storage)).toBe(true)
  })
})
