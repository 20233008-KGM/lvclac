import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { en } from '../i18n/locales/en'
import { ko } from '../i18n/locales/ko'

const source = readFileSync(resolve('src/components/AboutPage.tsx'), 'utf8')
const pagesCss = readFileSync(resolve('src/styles/pages.css'), 'utf8')

describe('dev service overview page', () => {
  it('uses the maintenance service overview copy in both locales', () => {
    expect(ko.about.title).toBe('서비스 소개')
    expect(ko.about.tagline).toBe('포지션 위험을, 한 화면에서')
    expect(ko.about.sections.map((section) => section.title)).toEqual([
      '흩어진 계산을 한곳에',
      '결과와 기준을 함께',
      '가볍게 시작하고, 선택해서 저장',
    ])
    expect(en.about.title).toBe('About the service')
    expect(en.about.tagline).toBe('See position risk in one place')
  })

  it('uses a localized contact CTA without duplicating operator details', () => {
    expect(source).toContain('about.contact.title')
    expect(source).toContain('about.contact.body')
    expect(source).toContain('mailto:${CONTACT_EMAIL}')
    expect(source).not.toContain('publicOperatorDetails')
    expect(source).not.toContain('about-operator')
  })

  it('separates the flat contact CTA from the footer without a card background', () => {
    expect(pagesCss).toMatch(
      /\.public-info-zone \.about-contact\s*\{[^}]*border-top:\s*1px solid var\(--public-info-rule\);/s,
    )
    expect(pagesCss).not.toMatch(
      /\.public-info-zone \.about-contact\s*\{[^}]*background:/s,
    )
  })
})
