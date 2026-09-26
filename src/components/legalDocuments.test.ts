import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildLegalDocuments } from './legalDocuments'

describe('detailed public legal documents', () => {
  it.each(['ko', 'en'] as const)('preserves substantive disclosure categories in %s', (locale) => {
    const { terms, privacy } = buildLegalDocuments(locale)
    expect(terms.sections).toHaveLength(13)
    expect(privacy.sections).toHaveLength(14)
    expect(privacy.sections.filter((section) => section.table)).toHaveLength(4)
    for (const document of [terms, privacy]) {
      expect(document.effective).toContain('2026')
      for (const section of document.sections) {
        expect(Boolean(section.paragraphs?.length || section.table?.rows.length)).toBe(true)
        for (const row of section.table?.rows ?? []) {
          expect(row).toHaveLength(section.table!.headers.length)
          expect(row.every((cell) => cell.trim().length > 0)).toBe(true)
        }
      }
    }
    const text = JSON.stringify(privacy)
    for (const provider of ['Supabase', 'Vercel', 'Google', 'Paddle', 'Resend']) {
      expect(text).toContain(provider)
    }
    expect(text).toContain('contact@farfield.software')
    expect(text).toContain('https://www.privacy.go.kr/')
  })

  it('describes present features and deletion behavior instead of the old public-only product', () => {
    const ko = JSON.stringify(buildLegalDocuments('ko'))
    const en = JSON.stringify(buildLegalDocuments('en'))
    expect(ko).toContain('일본(도쿄')
    expect(en).toContain('Japan (Tokyo')
    expect(ko).toContain('저장 안 함은 저장을 중지')
    expect(en).toContain('Do not save pauses saving')
    expect(ko).toContain('자동 갱신')
    expect(en).toContain('renew automatically')
    expect(ko).toContain('쿠키 없는 측정 신호')
    expect(en).toContain('cookieless measurement signals')
    expect(ko).not.toContain('현재 공개 서비스에는 로그인, 클라우드 저장, 결제 또는 Pro 기능이 없습니다')
    expect(en).not.toContain('does not currently offer sign-in or cloud storage')
    expect(ko).not.toContain('14개월')
    expect(en).not.toContain('14 months')
  })

  it('keeps the production router connected to the detailed renderer', () => {
    const app = readFileSync('src/App.tsx', 'utf8')
    const review = readFileSync('src/components/PaddleReviewPages.tsx', 'utf8')
    const legal = readFileSync('src/components/PublicLegalPage.tsx', 'utf8')
    expect(app).toContain('default: mod.PublicLegalPage')
    expect(review).toContain("import { PublicLegalPage as DetailedLegalPage } from './PublicLegalPage'")
    expect(review).toContain('<DetailedLegalPage kind={kind} />')
    expect(legal).toContain('buildLegalDocuments(locale)[kind]')
    expect(legal).toContain('section.table.rows.map')
  })

  it('keeps bilingual section structures and table categories aligned', () => {
    const ko = buildLegalDocuments('ko')
    const en = buildLegalDocuments('en')
    for (const kind of ['terms', 'privacy'] as const) {
      expect(ko[kind].sections.map((section) => section.table?.rows.length ?? 0))
        .toEqual(en[kind].sections.map((section) => section.table?.rows.length ?? 0))
      expect(ko[kind].sections.map((section) => section.paragraphs?.length ?? 0))
        .toEqual(en[kind].sections.map((section) => section.paragraphs?.length ?? 0))
    }
  })
})
