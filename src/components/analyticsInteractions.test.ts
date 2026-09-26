import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('granular interaction analytics', () => {
  it('tracks calculator input fields by stable field-specific event names without reading values', () => {
    const analytics = source('src/components/CalculatorAnalytics.tsx')

    expect(analytics).toContain("accountEval: 'account_equity'")
    expect(analytics).toContain("const eventName = `input_${field}`")
    expect(analytics).toContain("trackLiqGuardEvent(eventName, {")
    expect(analytics).not.toContain('value: inputs')
    expect(analytics).not.toContain('value,')
  })

  it('auto-captures distinct click, focus, and non-calculator input interactions', () => {
    const analytics = source('src/components/CalculatorAnalytics.tsx')

    expect(analytics).toContain("'[data-analytics-click]'")
    expect(analytics).toContain("'button'")
    expect(analytics).toContain("'a'")
    expect(analytics).toContain("document.addEventListener('focusin', handleFocusIn")
    expect(analytics).toContain("document.addEventListener('input', handleInput")
    expect(analytics).toContain("document.addEventListener('change', handleInput")
    expect(analytics).toContain("if (input.closest('.input-panel, .result-panel')) return")
  })

  it('pins high-value auth and account-equity actions to readable event names', () => {
    expect(source('src/components/InputPanel.tsx')).toContain('analyticsClick="click_account_equity"')
    expect(source('src/components/InputPanel.tsx')).toContain('analyticsInput="input_account_equity"')
    expect(source('src/components/auth/AuthButton.tsx')).toContain('data-analytics-click="open_login_chip"')
    expect(source('src/components/auth/GoogleButton.tsx')).toContain('data-analytics-click="click_google_login"')
    expect(source('src/components/auth/AuthModal.tsx')).toContain('data-analytics-click="click_login_modal_close"')
  })
})
