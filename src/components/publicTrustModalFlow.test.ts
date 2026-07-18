import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const main = readFileSync(resolve('src/main.tsx'), 'utf8')
const disclaimer = readFileSync(resolve('src/components/ServiceDisclaimer.tsx'), 'utf8')
const googleConsent = readFileSync(resolve('src/context/GoogleConsentContext.tsx'), 'utf8')
const ko = readFileSync(resolve('src/i18n/locales/ko.ts'), 'utf8')
const en = readFileSync(resolve('src/i18n/locales/en.ts'), 'utf8')

describe('public trust modal flow', () => {
  it('places Google consent inside the disclaimer flow coordinator', () => {
    expect(main.indexOf('<DisclaimerProvider>')).toBeLessThan(
      main.indexOf('<GoogleConsentProvider>'),
    )
    expect(main.indexOf('</GoogleConsentProvider>')).toBeLessThan(
      main.indexOf('</DisclaimerProvider>'),
    )
  })

  it('keeps service notice before device storage and shares the active gate', () => {
    expect(disclaimer).toContain("mode === 'required' && (open || saveConsentOpen)")
    expect(disclaimer.indexOf('{open && (')).toBeLessThan(
      disclaimer.indexOf('{saveConsentOpen && ('),
    )
    expect(disclaimer).toContain('firstVisitGateActive')
  })

  it('defers automatic custom privacy settings until the first-visit gate clears', () => {
    expect(googleConsent).toContain('if (firstVisitGateActive) setDeferredAutoOpen(true)')
    expect(googleConsent).toContain(
      'settingsOpen || (deferredAutoOpen && !firstVisitGateActive)',
    )
  })

  it('uses equal-weight direct privacy actions and localized status copy', () => {
    expect(googleConsent.match(/btn btn-ghost privacy-settings-action/g)).toHaveLength(2)
    for (const locale of [ko, en]) {
      expect(locale).toContain('statusDefaultBlocked:')
      expect(locale).toContain('statusDenied:')
      expect(locale).toContain('statusAllowed:')
    }
  })
})
