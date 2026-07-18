import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/AboutPage.tsx'), 'utf8')
const pagesCss = readFileSync(resolve('src/styles/pages.css'), 'utf8')

describe('public about page', () => {
  it('uses a localized contact CTA without duplicating operator details', () => {
    expect(source).toContain('about.contact.title')
    expect(source).toContain('about.contact.body')
    expect(source).toContain('mailto:${CONTACT_EMAIL}')
    expect(source).not.toContain('publicOperatorDetails')
    expect(source).not.toContain('about-operator')
  })

  it('separates the flat contact CTA from the footer without a card background', () => {
    expect(pagesCss).toMatch(
      /\.public-info-zone \.about-contact\s*{[^}]*border-top:\s*1px solid var\(--public-info-rule\);/s,
    )
    expect(pagesCss).not.toMatch(
      /\.public-info-zone \.about-contact\s*{[^}]*background:/s,
    )
  })
})
