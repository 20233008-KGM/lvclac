import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/SiteFooter.tsx'), 'utf8')

describe('public-lite footer links', () => {
  it('keeps only terms and privacy links in Korean', () => {
    expect(source).toContain("{ label: '이용약관', href: TERMS_PATH }")
    expect(source).toContain("{ label: '개인정보처리방침', href: PRIVACY_PATH }")
  })

  it('keeps only terms and privacy links in English', () => {
    expect(source).toContain("{ label: 'Terms', href: TERMS_PATH }")
    expect(source).toContain("{ label: 'Privacy', href: PRIVACY_PATH }")
    expect(source).not.toContain('PRICING_PATH')
    expect(source).not.toContain('REFUND_POLICY_PATH')
    expect(source).not.toContain('GUIDE_PATH')
  })
})
