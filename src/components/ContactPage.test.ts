import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/ContactPage.tsx'), 'utf8')
const css = readFileSync(resolve('src/styles/pages.css'), 'utf8')
const sitemap = readFileSync(resolve('public/sitemap.xml'), 'utf8')

describe('public contact page', () => {
  it('presents email as the primary channel without requiring a database or upload', () => {
    expect(source).toContain('영업 관련 제안, 버그 제보, 기타 문의')
    expect(source).toContain('PUBLIC_OPERATOR_INFO.contactEmail')
    expect(source).toContain('이메일 주소 복사')
    expect(source).toContain('이메일 앱 열기')
    expect(source).toContain("<CopyIcon copied={copyStatus === 'copied'} />")
    expect(source).toContain(
      "aria-label={copyStatus === 'copied' ? copy.copied : copy.copyEmail}",
    )
    expect(source).toContain('<rect x="8" y="8" width="11" height="11" rx="2" />')
    expect(source).toContain("type CopyStatus = 'idle' | 'copied' | 'error'")
    expect(source).not.toContain('input type="file"')
    expect(source).not.toContain('supabase')
  })

  it('uses a restrained responsive contact layout and publishes the route', () => {
    expect(css).toMatch(/\.contact-email-row/)
    expect(css).toMatch(/\.contact-copy-button\s*{/)
    expect(css).toMatch(
      /\.contact-guidance__grid\s*{[^}]*grid-template-columns:\s*repeat\(3,/s,
    )
    expect(css).toMatch(/@media \(max-width: 520px\)[\s\S]*\.contact-mail-link/)
    expect(sitemap).toContain('<loc>https://liqguard.com/contact</loc>')
  })
})
