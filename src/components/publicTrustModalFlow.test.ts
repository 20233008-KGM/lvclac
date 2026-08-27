import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const app = readFileSync(resolve('src/App.tsx'), 'utf8')
const disclaimer = readFileSync(resolve('src/components/ServiceDisclaimer.tsx'), 'utf8')
const googleConsent = readFileSync(resolve('src/context/GoogleConsentContext.tsx'), 'utf8')
const ko = readFileSync(resolve('src/i18n/locales/ko.ts'), 'utf8')
const en = readFileSync(resolve('src/i18n/locales/en.ts'), 'utf8')

describe('public trust modal flow', () => {
  it('places Google consent inside the disclaimer flow coordinator', () => {
    expect(app.indexOf('<DisclaimerProvider>')).toBeLessThan(
      app.indexOf('<GoogleConsentProvider>'),
    )
    expect(app.indexOf('</GoogleConsentProvider>')).toBeLessThan(
      app.indexOf('</DisclaimerProvider>'),
    )
  })

  it('keeps the seven-step welcome flow inside the disclaimer coordinator', () => {
    expect(disclaimer).toMatch(
      /<FirstVisitFlowContext\.Provider[\s\S]*?<WelcomeFlow\s+onComplete=\{handleWelcomeComplete\}\s*\/>/,
    )
    expect(disclaimer).toContain('const handleWelcomeComplete = (persist: boolean) =>')
    expect(disclaimer).not.toContain('<PublicSaveConsentModal')
  })

  it('defers automatic custom privacy settings until the first-visit gate clears', () => {
    expect(googleConsent).toContain('if (firstVisitGateActive) setDeferredAutoOpen(true)')
    expect(googleConsent).toContain(
      'settingsOpen || (deferredAutoOpen && !firstVisitGateActive)',
    )
  })

  it('uses equal-weight direct choices, granular settings, and localized ad notice', () => {
    expect(googleConsent.match(/btn btn-ghost privacy-settings-action/g)).toHaveLength(2)
    expect(googleConsent.match(/role="switch"/g)).toHaveLength(2)
    expect(googleConsent).toContain('aria-label={copy.analyticsTitle}')
    expect(googleConsent).toContain('aria-label={copy.personalizedAdsTitle}')
    expect(googleConsent).toContain('privacy-settings-details')
    for (const locale of [ko, en]) {
      expect(locale).toContain('statusDefaultBlocked:')
      expect(locale).toContain('statusDenied:')
      expect(locale).toContain('statusAllowed:')
      expect(locale).toContain('analyticsTitle:')
      expect(locale).toContain('personalizedAdsTitle:')
      expect(locale).toContain('adNotice:')
    }
  })
})
